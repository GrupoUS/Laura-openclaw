import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { evolutionCycles, capabilityScores } from '../db/schema'
import { storeMemory, getMemoryStats, consolidateMemories } from './memory'

// ── Types ──

type EvolutionTrigger = 'cron' | 'heartbeat' | 'manual' | 'mad_dog'

interface Finding {
  type: 'error' | 'correction' | 'pattern' | 'preference' | 'lesson'
  content: string
  severity: 'low' | 'medium' | 'high'
}

interface EvolutionResult {
  cycleId: string
  status: 'success' | 'failed' | 'skipped'
  findings: Finding[]
  memoriesCreated: number
  durationMs: number
}

// ── Session transcript reader ──

const AGENT_NAME = process.env.AGENT_NAME || 'main'
const SESSIONS_DIR = join(homedir(), `.openclaw/agents/${AGENT_NAME}/sessions`)

async function getRecentTranscripts(maxAge: number = 24 * 60 * 60 * 1000): Promise<string[]> {
  const transcripts: string[] = []
  const cutoff = Date.now() - maxAge

  try {
    const files = await readdir(SESSIONS_DIR)
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'))

    for (const file of jsonlFiles) {
      const filePath = join(SESSIONS_DIR, file)
      const stats = await stat(filePath)
      if (stats.mtime.getTime() > cutoff) {
        const content = await readFile(filePath, 'utf8')
        // Take last 10k chars to avoid memory issues
        transcripts.push(content.slice(-10000))
      }
    }
  } catch {
    // Sessions dir may not exist yet
  }

  return transcripts
}

// ── Memory/daily notes reader ──

const MEMORY_DIR = join(homedir(), '.openclaw/workspace/memory')

async function getRecentDailyNotes(days: number = 3): Promise<string[]> {
  const notes: string[] = []

  try {
    const files = await readdir(MEMORY_DIR)
    const dateFiles = files
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .toSorted()
      .slice(-days)

    for (const file of dateFiles) {
      const content = await readFile(join(MEMORY_DIR, file), 'utf8')
      notes.push(content)
    }
  } catch {
    // Memory dir may not exist
  }

  return notes
}

// ── Extract findings from transcript text ──

function extractFindings(transcripts: string[]): Finding[] {
  const findings: Finding[] = []
  const combined = transcripts.join('\n')

  // Error patterns
  const errorPatterns = [
    /(?:error|Error|ERROR)[:\s]+(.{10,200})/g,
    /(?:failed|Failed|FAILED)[:\s]+(.{10,200})/g,
    /(?:crash|Crash|CRASH)[:\s]+(.{10,200})/g,
    /(?:exception|Exception)[:\s]+(.{10,200})/g,
  ]

  for (const pattern of errorPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(combined)) !== null) {
      findings.push({
        type: 'error',
        content: match[1].trim(),
        severity: 'high',
      })
    }
  }

  // User correction patterns
  const correctionPatterns = [
    /(?:no,?\s+(?:do|use|try|make)\s+it\s+)(.{10,200})/gi,
    /(?:actually,?\s+)(.{10,200})/gi,
    /(?:instead,?\s+)(.{10,200})/gi,
    /(?:that'?s\s+(?:wrong|incorrect|not right))(.{0,200})/gi,
  ]

  for (const pattern of correctionPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(combined)) !== null) {
      findings.push({
        type: 'correction',
        content: match[1].trim(),
        severity: 'medium',
      })
    }
  }

  // Pattern: successful approaches
  const patternMatches = [
    /(?:worked|Works|working)[:\s!]+(.{10,200})/gi,
    /(?:solution|solved|fixed)[:\s]+(.{10,200})/gi,
  ]

  for (const pattern of patternMatches) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(combined)) !== null) {
      findings.push({
        type: 'pattern',
        content: match[1].trim(),
        severity: 'low',
      })
    }
  }

  // Deduplicate by content similarity (basic substring check)
  const unique: Finding[] = []
  for (const f of findings) {
    const isDupe = unique.some(
      (u) =>
        u.content.includes(f.content.substring(0, 30)) ||
        f.content.includes(u.content.substring(0, 30))
    )
    if (!isDupe) unique.push(f)
  }

  return unique.slice(0, 50) // Cap at 50 findings per cycle
}

// ── VFM Score calculation ──

function calculateVFMScore(capability: string, findings: Finding[]): number {
  const relevant = findings.filter((f) =>
    f.content.toLowerCase().includes(capability.toLowerCase())
  )

  // VFM: frequency(3x) + failureReduction(3x) + userBurden(2x) + selfCost(2x)
  const frequency = Math.min(relevant.length * 2, 10)
  const failureReduction = relevant.filter((f) => f.type === 'error').length > 0 ? 8 : 2
  const userBurden = relevant.filter((f) => f.type === 'correction').length > 0 ? 7 : 3
  const selfCost = 5 // Default middle

  return frequency * 3 + failureReduction * 3 + userBurden * 2 + selfCost * 2
}

// ── ADL Safety check ──

function passesADLCheck(findings: Finding[]): boolean {
  // ADL: Stability > Novelty
  // Reject if findings are vague or unverifiable
  const validFindings = findings.filter(
    (f) =>
      f.content.length > 20 &&
      !f.content.includes('intuition') &&
      !f.content.includes('feeling') &&
      !f.content.includes('dimension')
  )

  return validFindings.length > 0
}

// ── Main evolution cycle ──

export async function runEvolutionCycle(
  trigger: EvolutionTrigger
): Promise<EvolutionResult> {
  const startTime = Date.now()

  // Create cycle record
  const [cycle] = await db
    .insert(evolutionCycles)
    .values({ trigger, status: 'running' })
    .returning({ id: evolutionCycles.id })

  const cycleId = cycle.id

  try {
    // 1. INTROSPECT — Read recent transcripts and notes
    const transcripts = await getRecentTranscripts()
    const dailyNotes = await getRecentDailyNotes()
    const allContent = [...transcripts, ...dailyNotes]

    if (allContent.length === 0) {
      await db
        .update(evolutionCycles)
        .set({
          status: 'skipped',
          durationMs: Date.now() - startTime,
          findings: [],
          actions: [{ action: 'skipped', reason: 'No recent transcripts or notes found' }],
        })
        .where(eq(evolutionCycles.id, cycleId))

      return {
        cycleId,
        status: 'skipped',
        findings: [],
        memoriesCreated: 0,
        durationMs: Date.now() - startTime,
      }
    }

    // 2. EVOLVE — Extract findings
    const findings = extractFindings(allContent)

    // ADL safety check
    if (!passesADLCheck(findings) && findings.length > 0) {
      await db
        .update(evolutionCycles)
        .set({
          status: 'skipped',
          durationMs: Date.now() - startTime,
          findings,
          actions: [{ action: 'adl_rejected', reason: 'Findings did not pass ADL safety check' }],
        })
        .where(eq(evolutionCycles.id, cycleId))

      return {
        cycleId,
        status: 'skipped',
        findings,
        memoriesCreated: 0,
        durationMs: Date.now() - startTime,
      }
    }

    // 3. PERSIST — Store each finding as a memory with embedding
    let memoriesCreated = 0
    const actions: Array<Record<string, unknown>> = []

    for (const finding of findings) {
      const categoryMap: Record<string, 'lesson' | 'pattern' | 'correction' | 'decision' | 'preference' | 'gotcha'> = {
        error: 'gotcha',
        correction: 'correction',
        pattern: 'pattern',
        preference: 'preference',
        lesson: 'lesson',
      }

      const memoryId = await storeMemory({
        content: finding.content,
        category: categoryMap[finding.type] || 'lesson',
        source: `evolution:${trigger}:${cycleId}`,
        metadata: { severity: finding.severity, type: finding.type },
        score: calculateVFMScore(finding.content, findings),
      })

      if (memoryId) {
        memoriesCreated++
        actions.push({
          action: 'stored_memory',
          memoryId,
          category: categoryMap[finding.type],
        })
      }
    }

    // 4. Consolidate duplicates
    const merged = await consolidateMemories()
    if (merged > 0) {
      actions.push({ action: 'consolidated', merged })
    }

    // 5. Update cycle record
    const durationMs = Date.now() - startTime
    await db
      .update(evolutionCycles)
      .set({
        status: 'success',
        findings,
        actions,
        memoriesCreated,
        durationMs,
      })
      .where(eq(evolutionCycles.id, cycleId))

    return { cycleId, status: 'success', findings, memoriesCreated, durationMs }
  } catch (err) {
    const durationMs = Date.now() - startTime
    const error = err instanceof Error ? err.message : String(err)

    await db
      .update(evolutionCycles)
      .set({ status: 'failed', durationMs, error })
      .where(eq(evolutionCycles.id, cycleId))

    return {
      cycleId,
      status: 'failed',
      findings: [],
      memoriesCreated: 0,
      durationMs,
    }
  }
}

// ── Get evolution stats for dashboard ──

export async function getEvolutionStats() {
  const memoryStats = await getMemoryStats()

  const recentCycles = await db
    .select()
    .from(evolutionCycles)
    .orderBy(desc(evolutionCycles.createdAt))
    .limit(20)

  const totalCycles = await db
    .select({ count: sql<number>`count(*)` })
    .from(evolutionCycles)

  const successCycles = await db
    .select({ count: sql<number>`count(*)` })
    .from(evolutionCycles)
    .where(eq(evolutionCycles.status, 'success'))

  const topCapabilities = await db
    .select()
    .from(capabilityScores)
    .orderBy(desc(capabilityScores.totalScore))
    .limit(10)

  return {
    memories: memoryStats,
    cycles: {
      total: totalCycles[0]?.count ?? 0,
      successful: successCycles[0]?.count ?? 0,
      recent: recentCycles,
    },
    topCapabilities,
  }
}
