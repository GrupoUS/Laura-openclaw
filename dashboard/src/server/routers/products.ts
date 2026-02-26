import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { products } from '../db/schema'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'

const rawSql = neon(process.env.DATABASE_URL ?? '')

/** Upsert PRODUTOS_GRUPO_US.md into agent_files NeonDB table */
async function syncProductsToAgentFiles(markdown: string): Promise<void> {
  await rawSql`
    INSERT INTO agent_files (name, content, description, is_editable, updated_by)
    VALUES ('PRODUTOS_GRUPO_US.md', ${markdown}, 'Catálogo de produtos do Grupo US', false, 'dashboard')
    ON CONFLICT (name) DO UPDATE
      SET content = EXCLUDED.content,
          updated_at = NOW(),
          updated_by = 'dashboard'
  `
}

const AGENT_MEMORY_DIRS = [
  'agents/main/workspace/memory',
  'agents/cs/workspace/memory',
  'agents/suporte/workspace/memory',
  'agents/coder/workspace/memory',
]

function generateProductsMarkdown(rows: ProductRow[]): string {
  const now = new Date().toLocaleDateString('pt-BR')
  let md = `# 📦 PRODUTOS GRUPO US — Referência Completa\n`
  md += `*Para pesquisa de concorrentes e aprimoramento dos agentes*\n`
  md += `*Última atualização: ${now}*\n\n---\n\n`

  md += `## 📋 Descrições por Produto\n\n`

  for (const p of rows) {
    const details = (p.details ?? {}) as Record<string, unknown>
    md += `### ${p.name}\n`
    if (p.description) md += `- **Descrição:** ${p.description}\n`
    if (p.format) md += `- **Formato:** ${p.format}\n`
    if (p.category) md += `- **Categoria:** ${p.category}\n`
    if (p.price) md += `- **Preço:** R$ ${p.price}\n`
    if (details.requirements) md += `- **Requisito:** ${details.requirements}\n`
    if (details.paymentLink) md += `- **Link de venda:** ${details.paymentLink}\n`
    if (details.site) md += `- **Site:** ${details.site}\n`
    if (details.turmas) md += `- **Turmas:** ${details.turmas}\n`
    if (details.bonuses) md += `- **Bônus:** ${details.bonuses}\n`
    if (details.tagline) md += `- **Tagline:** *"${details.tagline}"*\n`
    md += `\n`
  }

  md += `---\n\n*Arquivo gerado automaticamente pelo Dashboard. Edições feitas aqui serão sobrescritas no próximo sync.*\n`
  return md
}

// Type helper for product rows
type ProductRow = Awaited<ReturnType<typeof db.query.products.findMany>>[number]

export const productsRouter = router({
  list: publicProcedure.query(async () => {
    return db.query.products.findMany({
      orderBy: (t, { asc: a }) => [a(t.name)],
    })
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1)
      return row ?? null
    }),

  upsert: publicProcedure
    .input(z.object({
      id:          z.number().optional(),
      name:        z.string().min(1),
      description: z.string().optional(),
      price:       z.string().optional(),
      format:      z.string().optional(),
      category:    z.string().optional(),
      details:     z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input

      if (id) {
        const [updated] = await db
          .update(products)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(products.id, id))
          .returning()
        // Auto-sync markdown to agent_files after any edit
        const all = await db.query.products.findMany({ orderBy: (t, { asc: a }) => [a(t.name)] })
        void syncProductsToAgentFiles(generateProductsMarkdown(all))
        return updated
      }

      const [created] = await db
        .insert(products)
        .values(data)
        .returning()
      // Auto-sync markdown to agent_files after new product
      const all = await db.query.products.findMany({ orderBy: (t, { asc: a }) => [a(t.name)] })
      void syncProductsToAgentFiles(generateProductsMarkdown(all))
      return created
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(products).where(eq(products.id, input.id))
      // Auto-sync markdown to agent_files after deletion
      const all = await db.query.products.findMany({ orderBy: (t, { asc: a }) => [a(t.name)] })
      void syncProductsToAgentFiles(generateProductsMarkdown(all))
      return { success: true }
    }),

  syncToAgents: publicProcedure.mutation(async () => {
    const rows = await db.query.products.findMany({
      orderBy: (t, { asc: a }) => [a(t.name)],
    })

    const markdown = generateProductsMarkdown(rows)

    // Always sync to NeonDB agent_files (works in cloud + local)
    await syncProductsToAgentFiles(markdown)

    const baseDir = process.env.OPENCLAW_DIR ?? ''
    if (!baseDir) return { success: true, synced: 0, total: 0, errors: [], note: 'Synced to NeonDB. OPENCLAW_DIR not set — skipping local files.' }

    const results = await Promise.allSettled(
      AGENT_MEMORY_DIRS.map((dir) =>
        writeFile(join(baseDir, dir, 'PRODUTOS_GRUPO_US.md'), markdown, 'utf-8').then(() => dir)
      )
    )

    const errors: string[] = []
    let synced = 0
    for (const r of results) {
      if (r.status === 'fulfilled') synced++
      else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason))
    }

    return { success: errors.length === 0, synced, total: AGENT_MEMORY_DIRS.length, errors }
  }),

  seed: publicProcedure.mutation(async () => {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(products)
    if (Number(existing[0]?.count ?? 0) > 0) {
      return { seeded: false, message: 'Products already exist' }
    }

    const seedData = [
      {
        name: 'COMU US',
        description: 'Comunidade que acompanha o crescimento profissional do captação à fidelização de pacientes.',
        format: 'Material gravado + encontro mensal ao vivo',
        category: 'Comunidade',
        details: {
          site: 'https://drasacha.com.br',
          paymentLink: 'https://pay.kiwify.com.br/YDb0Mmy',
          tagline: 'Se sozinho você já brilha, juntos ILUMINAMOS!',
          requirements: 'Nenhum',
        },
      },
      {
        name: 'OTB — Out of the Box',
        description: 'O Primeiro MBA em Business Aesthetic Health',
        format: 'MBA com fases presenciais em locais estratégicos',
        category: 'MBA',
        details: {
          site: 'https://otb.gpus.com.br',
          requirements: 'Graduação em saúde + visto EUA',
          turmas: 'OTB Turma 2, OTB Turma 3',
        },
      },
      {
        name: 'TRINTAE3',
        description: 'Pós-graduação Lato Sensu em Estética Avançada e Métodos Invasivos (534h)',
        format: '3 fases presenciais + material online',
        category: 'Pós-Graduação',
        details: {
          requirements: 'Graduação em área da saúde',
          turmas: 'Turma 3, 4, 5, 6',
          bonuses: 'Curso de Aurículo com Dra. Sacha + Comunidade US',
        },
      },
      {
        name: 'NEON',
        description: 'Mentoria Black Neon 2025 — individualizada para gestores com clínica',
        format: 'Mentoria Black — alta personalização',
        category: 'Mentoria',
        details: {
          requirements: 'Graduação + clínica estabelecida + faturamento ativo',
        },
      },
      {
        name: 'Aurículo',
        description: 'Curso de Auriculoterapia com Técnica de Perfuração Auricular com Dra. Sacha Gualberto',
        format: 'Curso',
        category: 'Curso',
        details: {
          paymentLink: 'https://pay.kiwify.com.br/NLJ62nO',
          requirements: 'Nenhum',
        },
      },
    ]

    await db.insert(products).values(seedData)
    return { seeded: true, count: seedData.length }
  }),
})
