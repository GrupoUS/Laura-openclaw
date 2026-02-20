import { GoogleGenAI } from '@google/genai'

const EMBEDDING_MODEL = 'text-embedding-004'
const EMBEDDING_DIMENSIONS = 768

let aiClient: GoogleGenAI | null = null

function getClient(): GoogleGenAI | null {
  if (aiClient) return aiClient
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.warn('[embedding] GOOGLE_API_KEY not set — embedding generation disabled')
    return null
  }
  aiClient = new GoogleGenAI({ apiKey })
  return aiClient
}

/**
 * Generate a 768-dimensional embedding for a single text.
 * Returns null if the API key is not configured.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getClient()
  if (!client) return null

  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  })

  return response.embeddings?.[0]?.values ?? null
}

/**
 * Generate embeddings for multiple texts in a single batch.
 * Returns null entries for any text that fails.
 */
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<(number[] | null)[]> {
  const client = getClient()
  if (!client) return texts.map(() => null)

  const results: (number[] | null)[] = []

  // Process in chunks of 100 (API limit)
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100)
    const promises = batch.map(async (t) => {
      try {
        const response = await client.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: t,
          config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        })
        return response.embeddings?.[0]?.values ?? null
      } catch (err) {
        console.error(`[embedding] Failed for text chunk: ${(err as Error).message}`)
        return null
      }
    })
    const batchResults = await Promise.all(promises)
    results.push(...batchResults)
  }

  return results
}
