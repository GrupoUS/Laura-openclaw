import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { agentFiles } from '../db/schema'
import { eventBus } from '../events/emitter'

export const filesRouter = router({
  /** List all agent files with metadata (no content) */
  getAll: publicProcedure.query(async () => {
    const rows = await db
      .select({
        id: agentFiles.id,
        name: agentFiles.name,
        description: agentFiles.description,
        isEditable: agentFiles.isEditable,
        source: agentFiles.source,
        updatedBy: agentFiles.updatedBy,
        updatedAt: agentFiles.updatedAt,
      })
      .from(agentFiles)
      .orderBy(agentFiles.name)

    return rows.map((r) => ({
      name: r.name,
      path: r.name,
      description: r.description,
      isEditable: r.isEditable,
      source: r.source,
      updatedBy: r.updatedBy,
      lastModified: r.updatedAt?.toISOString() ?? null,
    }))
  }),

  /** Read a single file's content */
  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(agentFiles)
        .where(eq(agentFiles.name, input.name))
        .limit(1)

      if (!row) return { content: '', error: 'File not found', lastModified: null }
      return {
        content: row.content,
        error: null,
        lastModified: row.updatedAt?.toISOString() ?? null,
      }
    }),

  /** Update a file's content + notify SSE clients */
  update: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      content: z.string(),
      source: z.enum(['dashboard', 'disk', 'bridge']).default('dashboard'),
    }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(agentFiles)
        .set({
          content: input.content,
          source: input.source,
          updatedBy: input.source,
          updatedAt: new Date(),
        })
        .where(eq(agentFiles.name, input.name))
        .returning({ id: agentFiles.id })

      if (!updated) return { ok: false, error: 'File not found' }

      eventBus.publish({
        type: 'file:updated',
        taskId: 0,
        payload: { name: input.name, content: input.content, source: input.source },
        agent: 'dashboard',
        ts: new Date().toISOString(),
      })

      return { ok: true, error: null }
    }),
})
