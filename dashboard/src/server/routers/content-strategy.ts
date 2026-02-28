import { readFile } from 'fs/promises'
import { join } from 'path'
import { router, publicProcedure } from '../trpc-init'

const MEMORY_DIR = '/Users/mauricio/.openclaw/agents/main/workspace/memory'

const FILES = {
  roteiro: 'roteiro-semana-03-03-2026.md',
  copies: 'copies-semana-03-03.md',
  reels: 'roteiros-reels-semana-03-03.md',
  calendario: 'calendario-editorial-03-03.md',
  stories: 'stories-prevenda-semana-03-03.md',
  trafego: 'trafego-semana-03-03.md',
  tendencias: 'tendencias-semana-03-03.md',
} as const

async function readMd(filename: string): Promise<string> {
  try {
    return await readFile(join(MEMORY_DIR, filename), 'utf-8')
  } catch {
    return `> ⚠️ Arquivo não encontrado: ${filename}`
  }
}

export const contentStrategyRouter = router({
  all: publicProcedure.query(async () => {
    const [roteiro, copies, reels, calendario, stories, trafego, tendencias] = await Promise.all([
      readMd(FILES.roteiro),
      readMd(FILES.copies),
      readMd(FILES.reels),
      readMd(FILES.calendario),
      readMd(FILES.stories),
      readMd(FILES.trafego),
      readMd(FILES.tendencias),
    ])
    return { roteiro, copies, reels, calendario, stories, trafego, tendencias }
  }),
})
