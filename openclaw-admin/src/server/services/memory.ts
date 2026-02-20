import { eq, desc, gt, sql, and, lt } from 'drizzle-orm'
import { cosineDistance } from 'drizzle-orm'
import { db } from '../db/client'
import { agentMemories, type memoryCategoryEnum } from '../db/schema'
import { generateEmbedding } from './embedding'

// ── Types ──

type MemoryCategory = (typeof memoryCategoryEnum.enumValues)[number]

interface StoreMemoryInput {
  content: string
  category: MemoryCategory
  source: string
  metadata?: Record<string, unknown>
  score?: number
}

interface RecallOptions {
  query: string
  category?: MemoryCategory
  threshold?: number
  limit?: number
}

interface MemoryResult {
  id: string
  content: string
  category: string
  source: string
  score: number | null
  similarity: number
  createdAt: Date | null
}

// ── Store a new memory with embedding ──

export async function storeMemory(input: StoreMemoryInput): Promise<string | null> {
  const embedding = await generateEmbedding(input.content)

  const [row] = await db
    .insert(agentMemories)
    .values({
      content: input.content,
      embedding,
      category: input.category,
      source: input.source,
      metadata: input.metadata ?? null,
      score: input.score ?? 0,
    })
    .returning({ id: agentMemories.id })

  return row?.id ?? null
}

// ── Semantic recall via cosine similarity ──

export async function recall(options: RecallOptions): Promise<MemoryResult[]> {
  const embedding = await generateEmbedding(options.query)
  if (!embedding) return []

  const threshold = options.threshold ?? 0.5
  const limit = options.limit ?? 10

  const similarity = sql<number>`1 - (${cosineDistance(agentMemories.embedding, embedding)})`

  const conditions = [gt(similarity, threshold)]
  if (options.category) {
    conditions.push(eq(agentMemories.category, options.category))
  }

  const results = await db
    .select({
      id: agentMemories.id,
      content: agentMemories.content,
      category: agentMemories.category,
      source: agentMemories.source,
      score: agentMemories.score,
      similarity,
      createdAt: agentMemories.createdAt,
    })
    .from(agentMemories)
    .where(and(...conditions))
    .orderBy(desc(similarity))
    .limit(limit)

  return results
}

// ── List memories with optional filters ──

export async function listMemories(options?: {
  category?: MemoryCategory
  limit?: number
  offset?: number
}) {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  const conditions = []
  if (options?.category) {
    conditions.push(eq(agentMemories.category, options.category))
  }

  return db
    .select()
    .from(agentMemories)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(agentMemories.createdAt))
    .limit(limit)
    .offset(offset)
}

// ── Delete a memory ──

export async function deleteMemory(id: string): Promise<boolean> {
  const result = await db
    .delete(agentMemories)
    .where(eq(agentMemories.id, id))
    .returning({ id: agentMemories.id })

  return result.length > 0
}

// ── Consolidate: merge duplicates with similarity > 0.95 ──

export async function consolidateMemories(): Promise<number> {
  const all = await db
    .select({ id: agentMemories.id, content: agentMemories.content })
    .from(agentMemories)
    .orderBy(desc(agentMemories.createdAt))

  let merged = 0
  const processed = new Set<string>()

  for (const memory of all) {
    if (processed.has(memory.id)) continue

    const duplicates = await recall({
      query: memory.content,
      threshold: 0.95,
      limit: 10,
    })

    const dupeIds = duplicates
      .filter((d) => d.id !== memory.id && !processed.has(d.id))
      .map((d) => d.id)

    for (const dupeId of dupeIds) {
      await deleteMemory(dupeId)
      processed.add(dupeId)
      merged++
    }

    processed.add(memory.id)
  }

  return merged
}

// ── Prune: remove low-score old memories ──

export async function pruneMemories(
  olderThanDays: number = 90,
  belowScore: number = 20
): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - olderThanDays)

  const result = await db
    .delete(agentMemories)
    .where(
      and(
        lt(agentMemories.createdAt, cutoff),
        lt(agentMemories.score, belowScore)
      )
    )
    .returning({ id: agentMemories.id })

  return result.length
}

// ── Stats ──

export async function getMemoryStats() {
  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(agentMemories)

  const byCategory = await db
    .select({
      category: agentMemories.category,
      count: sql<number>`count(*)`,
    })
    .from(agentMemories)
    .groupBy(agentMemories.category)

  return {
    total: total[0]?.count ?? 0,
    byCategory: byCategory.reduce(
      (acc, row) => {
        acc[row.category] = row.count
        return acc
      },
      {} as Record<string, number>
    ),
  }
}
