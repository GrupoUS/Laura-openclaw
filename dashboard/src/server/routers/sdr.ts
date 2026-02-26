import { z } from 'zod'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { leadHandoffs, lauraMemories } from '../db/schema'
import { desc, eq, sql, count } from 'drizzle-orm'
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, resolve, extname } from 'node:path'

export const sdrRouter = router({
  kpis: publicProcedure.query(async () => {
    // Leads contacted: unique lead_interaction memories
    const contactedResult = await db
      .select({ count: count() })
      .from(lauraMemories)
      .where(sql`${lauraMemories.metadata}->>'type' = 'lead_interaction'`)
    const leadsContacted = contactedResult[0]?.count ?? 0

    // Handoff stats
    const totalHandoffs = await db.select({ count: count() }).from(leadHandoffs)
    const leadsHandedOff = totalHandoffs[0]?.count ?? 0

    const convertedResult = await db
      .select({ count: count() })
      .from(leadHandoffs)
      .where(eq(leadHandoffs.status, 'converted'))
    const leadsConverted = convertedResult[0]?.count ?? 0

    // Top objections from sdr_action memories
    const objectionsRaw = await db
      .select({
        objection: sql<string>`${lauraMemories.metadata}->>'objection'`,
        count: count(),
      })
      .from(lauraMemories)
      .where(sql`${lauraMemories.metadata}->>'type' = 'sdr_action' AND ${lauraMemories.metadata}->>'objection' IS NOT NULL`)
      .groupBy(sql`${lauraMemories.metadata}->>'objection'`)
      .orderBy(sql`count(*) DESC`)
      .limit(10)

    const topObjections = objectionsRaw.map((r) => ({
      objection: r.objection ?? 'Desconhecida',
      count: r.count,
    }))

    const conversionRate = leadsHandedOff > 0
      ? Math.round((leadsConverted / leadsHandedOff) * 100)
      : 0

    return {
      leadsContacted,
      leadsHandedOff,
      leadsConverted,
      topObjections,
      conversionRate,
      avgResponseTime: '-',
    }
  }),

  recentLeads: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['all', 'pending', 'contacted', 'converted', 'lost']).default('all'),
      })
    )
    .query(async ({ input }) => {
      const conditions = input.status !== 'all'
        ? eq(leadHandoffs.status, input.status)
        : undefined

      const rows = await db
        .select({
          id: leadHandoffs.id,
          leadPhone: leadHandoffs.leadPhone,
          leadName: leadHandoffs.leadName,
          product: leadHandoffs.product,
          closerPhone: leadHandoffs.closerPhone,
          closerName: leadHandoffs.closerName,
          status: leadHandoffs.status,
          handoffAt: leadHandoffs.handoffAt,
          notes: leadHandoffs.notes,
        })
        .from(leadHandoffs)
        .where(conditions)
        .orderBy(desc(leadHandoffs.handoffAt))
        .limit(input.limit)
        .offset(input.offset)

      const totalResult = await db
        .select({ count: count() })
        .from(leadHandoffs)
        .where(conditions)

      return {
        leads: rows,
        total: totalResult[0]?.count ?? 0,
      }
    }),

  agentFiles: publicProcedure.query(async () => {
    const agentDir = process.env.SDR_AGENT_DIR
    if (!agentDir) return []

    try {
      const entries = await readdir(agentDir)
      const mdFiles = entries.filter((f) => extname(f) === '.md')

      const results = await Promise.all(
        mdFiles.map(async (name) => {
          const fullPath = join(agentDir, name)
          const info = await stat(fullPath)
          return {
            name,
            path: fullPath,
            sizeKb: Math.round(info.size / 1024),
            lastModified: info.mtime.toISOString(),
          }
        })
      )
      return results
    } catch {
      return []
    }
  }),

  readFile: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input }) => {
      const agentDir = process.env.SDR_AGENT_DIR
      if (!agentDir) return { content: '', error: 'SDR_AGENT_DIR not set' }

      // Path traversal guard
      const resolved = resolve(input.filePath)
      if (!resolved.startsWith(resolve(agentDir))) {
        return { content: '', error: 'Access denied' }
      }

      try {
        const content = await readFile(resolved, 'utf-8')
        return { content, error: null }
      } catch {
        return { content: '', error: 'File not found' }
      }
    }),

  writeFile: publicProcedure
    .input(
      z.object({
        filePath: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const agentDir = process.env.SDR_AGENT_DIR
      if (!agentDir) return { success: false, error: 'SDR_AGENT_DIR not set' }

      // Path traversal guard
      const resolved = resolve(input.filePath)
      if (!resolved.startsWith(resolve(agentDir))) {
        return { success: false, error: 'Access denied' }
      }

      // Only allow .md files
      if (extname(resolved) !== '.md') {
        return { success: false, error: 'Only .md files allowed' }
      }

      try {
        await writeFile(resolved, input.content, 'utf-8')
        return { success: true, error: null }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }),
})
