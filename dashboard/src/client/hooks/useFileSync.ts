import { useState, useEffect, useCallback, useRef } from 'react'
import { trpc } from '@/client/trpc'

interface FileSyncState {
  content: string
  isLoading: boolean
  lastUpdated: string | null
  isDirty: boolean
  isSaving: boolean
  error: string | null
  save: () => Promise<void>
  setContent: (content: string) => void
}

export function useFileSync(name: string): FileSyncState {
  const [content, setContentState] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameRef = useRef(name)
  nameRef.current = name

  const utils = trpc.useUtils()

  // Fetch from NeonDB via tRPC
  const { data, isLoading } = trpc.files.get.useQuery(
    { name },
    { staleTime: 60_000 }
  )

  // Hydrate content when query resolves
  useEffect(() => {
    if (data && !data.error) {
      setContentState(data.content)
      setSavedContent(data.content)
      setLastUpdated(data.lastModified)
      setError(null)
    } else if (data?.error) {
      setError(data.error)
    }
  }, [data])

  const updateMutation = trpc.files.update.useMutation()

  // Listen for SSE file:updated events via window CustomEvent
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name: string; content: string; source?: string }
      if (detail.name !== name) return
      // Don't update if the source is dashboard (we already have the content)
      if (detail.source === 'dashboard') return

      setContentState(detail.content)
      setSavedContent(detail.content)
      setLastUpdated(new Date().toISOString())
    }

    window.addEventListener('file:updated', handler)
    return () => window.removeEventListener('file:updated', handler)
  }, [name])

  const setContent = useCallback((value: string) => {
    setContentState(value)
    setError(null)
  }, [])

  const save = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      const result = await updateMutation.mutateAsync({
        name: nameRef.current,
        content,
        source: 'dashboard',
      })
      if (!result.ok) {
        throw new Error(result.error ?? 'Failed to save')
      }
      setSavedContent(content)
      setLastUpdated(new Date().toISOString())
      // Invalidate the query cache
      utils.files.get.invalidate({ name: nameRef.current })
      utils.files.getAll.invalidate()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }, [content, updateMutation, utils])

  return {
    content,
    isLoading,
    lastUpdated,
    isDirty: content !== savedContent,
    isSaving,
    error,
    save,
    setContent,
  }
}
