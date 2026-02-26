import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { router, publicProcedure } from '../trpc-init'
import { db } from '../db/client'
import { products } from '../db/schema'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'
import { eventBus } from '../events/emitter'

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

/** Write produtos.md to SDR agent dir + publish file:updated event */
async function syncProductsToDisk(markdown: string): Promise<boolean> {
  const sdrDir = process.env.SDR_AGENT_DIR
  if (!sdrDir) return false
  try {
    await writeFile(join(sdrDir, 'produtos.md'), markdown, 'utf-8')
    eventBus.publish({
      type: 'file:updated',
      taskId: 0,
      payload: { name: 'produtos', content: markdown, source: 'dashboard' },
      agent: 'dashboard',
      ts: new Date().toISOString(),
    })
    return true
  } catch {
    return false
  }
}

const PRODUCTS_DIR = '/Users/mauricio/.openclaw/products'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateSingleProductMarkdown(p: ProductRow): string {
  const details = (p.details ?? {}) as Record<string, unknown>
  const now = new Date().toLocaleDateString('pt-BR')
  let md = `# Produto: ${p.name}`
  if (p.category) md += ` (${p.category})`
  md += `\n\n`

  if (p.description) {
    md += `## Resumo\n${p.description}\n\n`
  }

  const meta: string[] = []
  if (p.format) meta.push(`- **Formato:** ${p.format}`)
  if (p.category) meta.push(`- **Categoria:** ${p.category}`)
  if (p.price) meta.push(`- **Preço:** R$ ${p.price}`)
  if (details.requirements) meta.push(`- **Requisito:** ${details.requirements}`)
  if (details.turmas) meta.push(`- **Turmas:** ${details.turmas}`)
  if (details.bonuses) meta.push(`- **Bônus:** ${details.bonuses}`)
  if (details.site) meta.push(`- **Site:** ${details.site}`)
  if (details.paymentLink) meta.push(`- **Link de venda:** ${details.paymentLink}`)
  if (details.tagline) meta.push(`- **Tagline:** *"${details.tagline}"*`)

  if (meta.length > 0) {
    md += `## Informações\n${meta.join('\n')}\n\n`
  }

  // If details has a fullContent field, append it as the full body
  if (typeof details.fullContent === 'string' && details.fullContent) {
    md += `---\n\n${details.fullContent}\n\n`
  }

  md += `---\n\n*Última atualização: ${now} (sync automático do Dashboard)*\n`
  return md
}

/** Write individual product .md files to /products/ directory */
async function syncProductsToLocalFiles(rows: ProductRow[]): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0

  try {
    await mkdir(PRODUCTS_DIR, { recursive: true })
  } catch {
    return { synced: 0, errors: ['Failed to create products directory'] }
  }

  const results = await Promise.allSettled(
    rows.map((p) => {
      const slug = slugify(p.name)
      const filePath = join(PRODUCTS_DIR, `${slug}.md`)
      const content = generateSingleProductMarkdown(p)
      return writeFile(filePath, content, 'utf-8').then(() => slug)
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled') synced++
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason))
  }

  return { synced, errors }
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
        // Auto-sync markdown to agent_files + local disk after any edit
        const all = await db.query.products.findMany({ orderBy: (t, { asc: a }) => [a(t.name)] })
        const md = generateProductsMarkdown(all)
        void syncProductsToAgentFiles(md)
        void syncProductsToDisk(md)
        void syncProductsToLocalFiles(all)
        return updated
      }

      const [created] = await db
        .insert(products)
        .values(data)
        .returning()
      // Auto-sync markdown to agent_files + local disk after new product
      const all = await db.query.products.findMany({ orderBy: (t, { asc: a }) => [a(t.name)] })
      const md = generateProductsMarkdown(all)
      void syncProductsToAgentFiles(md)
      void syncProductsToDisk(md)
      void syncProductsToLocalFiles(all)
      return created
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(products).where(eq(products.id, input.id))
      // Auto-sync markdown to agent_files + local disk + /products/ after deletion
      const all = await db.query.products.findMany({ orderBy: (t, { asc: a }) => [a(t.name)] })
      const md = generateProductsMarkdown(all)
      void syncProductsToAgentFiles(md)
      void syncProductsToDisk(md)
      void syncProductsToLocalFiles(all)
      return { success: true }
    }),

  syncToAgents: publicProcedure.mutation(async () => {
    const rows = await db.query.products.findMany({
      orderBy: (t, { asc: a }) => [a(t.name)],
    })

    const markdown = generateProductsMarkdown(rows)

    // Always sync to NeonDB agent_files (works in cloud + local)
    await syncProductsToAgentFiles(markdown)

    // Sync individual product files to /products/ directory
    const localResult = await syncProductsToLocalFiles(rows)

    const baseDir = process.env.OPENCLAW_DIR ?? ''
    if (!baseDir) return { success: localResult.errors.length === 0, synced: localResult.synced, total: localResult.synced, errors: localResult.errors }

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
