import { useState, useEffect, useCallback, useRef } from 'react'

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
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameRef = useRef(name)
  nameRef.current = name

  // Initial fetch
  useEffect(() => {
    setIsLoading(true)
    setError(null)

    fetch(`/api/files/${name}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Failed to fetch' }))
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data: { content: string; lastModified: string }) => {
        if (nameRef.current === name) {
          setContentState(data.content)
          setSavedContent(data.content)
          setLastUpdated(data.lastModified)
          setError(null)
        }
      })
      .catch((err) => {
        if (nameRef.current === name) {
          setError((err as Error).message)
        }
      })
      .finally(() => {
        if (nameRef.current === name) {
          setIsLoading(false)
        }
      })
  }, [name])

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
      const res = await fetch(`/api/files/${nameRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to save' }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setSavedContent(content)
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }, [content])

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
