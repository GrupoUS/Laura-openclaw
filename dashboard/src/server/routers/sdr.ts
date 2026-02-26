import { z } from 'zod'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { leadHandoffs, lauraMemories } from '../db/schema'
import { desc, eq, sql, count } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL ?? ''
const rawSql = neon(databaseUrl)

export const sdrRouter = router({
  kpis: publicProcedure.query(async () => {
    // Leads contacted: unique leads with sdr_action OR lead_interaction memories
    const contactedResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${lauraMemories.metadata}->>'lead')` })
      .from(lauraMemories)
      .where(sql`${lauraMemories.metadata}->>'type' IN ('sdr_action', 'lead_interaction') AND ${lauraMemories.metadata}->>'lead' IS NOT NULL`)
    const leadsContacted = Number(contactedResult[0]?.count ?? 0)

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
      .where(sql`${lauraMemories.metadata}->>'type' IN ('sdr_action', 'objection_handled') AND ${lauraMemories.metadata}->>'objection' IS NOT NULL`)
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
    const rows = await rawSql`
      SELECT id, name, description, is_editable, updated_at, updated_by,
        length(content) as size_bytes FROM agent_files ORDER BY name`
    return rows.map((r) => ({
      name: r.name as string,
      path: r.name as string,
      sizeKb: Math.round((r.size_bytes as number) / 1024),
      lastModified: (r.updated_at as Date).toISOString(),
      isEditable: r.is_editable as boolean,
      description: r.description as string | null,
    }))
  }),

  readFile: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input }) => {
      const rows = await rawSql`SELECT content FROM agent_files WHERE name = ${input.filePath}`
      if (!rows[0]) return { content: '', error: 'File not found' }
      return { content: rows[0].content as string, error: null }
    }),

  writeFile: publicProcedure
    .input(
      z.object({
        filePath: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const rows = await rawSql`
        UPDATE agent_files SET content = ${input.content}, updated_at = NOW(), updated_by = 'dashboard'
        WHERE name = ${input.filePath} AND is_editable = true
        RETURNING id`
      if (!rows[0]) return { success: false, error: 'File not found or not editable' }
      return { success: true, error: null }
    }),
})
