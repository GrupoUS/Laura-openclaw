#!/usr/bin/env bun
/**
 * Generate a JSON snapshot of the OpenClaw hierarchy + skills for deployments
 * where the local filesystem is not available (e.g., Railway).
 *
 * Run: bun run scripts/snapshot-openclaw.ts
 * Output: src/server/data/openclaw-snapshot.json
 */
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'

const OPENCLAW_JSON = '/Users/mauricio/.openclaw/openclaw.json'
const WORKSPACE_SKILLS_DIR = '/Users/mauricio/.openclaw/workspace/skills'
const OUTPUT = join(dirname(import.meta.dir), 'src/server/data/openclaw-snapshot.json')

const REPORT_PATTERNS = [
  /[Rr]eporto\s+(?:à|ao)\s+\*\*(\w+)\*\*/,
  /[Rr]eporto\s+(?:à|ao)\s+(\w+)/,
  /delegad[oa]\s+pel[oa]\s+(\w+)/i,
]

const NAME_TO_ID: Record<string, string> = {
  Laura: 'main', Maurício: 'mauricio', Celso: 'celso', Flora: 'flora',
  Otto: 'otto', Cris: 'cris', Mila: 'mila', Claudete: 'claudete',
}

interface AgentSnapshot {
  id: string
  name: string
  role: string
  level: number
  reportsTo: string | null
  skills: string[]
}

async function main() {
  const raw = await readFile(OPENCLAW_JSON, 'utf-8')
  const config = JSON.parse(raw)
  const agents = config.agents?.list ?? []

  const result: AgentSnapshot[] = [
    { id: 'mauricio', name: 'Maurício', role: 'Fundador', level: 0, reportsTo: null, skills: [] },
  ]

  for (const agent of agents) {
    let name = agent.name.split('(')[0].trim()
    let role = agent.name.match(/\((.+)\)/)?.[1] ?? agent.id
    let reportsTo = 'laura'

    // Read IDENTITY.md
    try {
      const identity = await readFile(join(agent.agentDir, 'workspace', 'IDENTITY.md'), 'utf-8')
      const nm = identity.match(/\*\*Nome:\*\*\s*(.+)/i)
      const rl = identity.match(/\*\*Espécie:\*\*\s*(.+)/i)
      if (nm) name = nm[1].trim()
      if (rl) role = rl[1].trim()
    } catch {}

    // Read AGENTS.md for reportsTo
    try {
      const md = await readFile(join(agent.agentDir, 'workspace', 'AGENTS.md'), 'utf-8')
      for (const p of REPORT_PATTERNS) {
        const m = md.match(p)
        if (m) { reportsTo = NAME_TO_ID[m[1]] ?? m[1].toLowerCase(); break }
      }
    } catch {}

    // Extract skills
    let skills: string[] = []
    try {
      const md = await readFile(join(agent.agentDir, 'workspace', 'AGENTS.md'), 'utf-8')
      const section = md.match(/## Skills Mandatórias[\s\S]*?(?=\n## |\n---|$)/i)
      if (section) {
        const pattern = /skills\/([a-z0-9_-]+)\/SKILL\.md/g
        let m
        while ((m = pattern.exec(section[0])) !== null) {
          if (!skills.includes(m[1])) skills.push(m[1])
        }
      }
    } catch {}

    const hierarchyId = agent.id === 'main' ? 'laura' : agent.id
    const finalReport = agent.id === 'main' ? 'mauricio' : (reportsTo === 'main' ? 'laura' : reportsTo)
    let level = 2
    if (finalReport === 'mauricio') level = 1
    else if (finalReport === 'laura') level = 2
    else level = 3

    result.push({
      id: hierarchyId,
      name: agent.id === 'main' ? 'Laura' : name,
      role: agent.id === 'main' ? 'CEO — Orquestradora & SDR' : role,
      level,
      reportsTo: finalReport,
      skills,
    })
  }

  // Scan workspace skills
  let workspaceSkills: string[] = []
  try {
    const entries = await readdir(WORKSPACE_SKILLS_DIR, { withFileTypes: true })
    workspaceSkills = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
      .map((e) => e.name)
  } catch {}

  // Ensure output directory
  await mkdir(dirname(OUTPUT), { recursive: true })

  const snapshot = {
    generatedAt: new Date().toISOString(),
    agents: result,
    workspaceSkills,
  }

  await writeFile(OUTPUT, JSON.stringify(snapshot, null, 2))
  console.log(`✅ Snapshot written to ${OUTPUT}`)
  console.log(`   ${result.length} agents, ${workspaceSkills.length} workspace skills`)
}

main().catch(console.error)
