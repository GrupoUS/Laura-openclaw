import { useState, useCallback } from 'react'
import type { UserPreferences } from '../../server/session'

export function usePreferences(initial: UserPreferences) {
  const [prefs, setPrefs] = useState<UserPreferences>(initial)

  const updatePref = useCallback(async <K extends keyof UserPreferences>(
    key: K, value: UserPreferences[K]
  ) => {
    // Atualização optimista — UI reflete imediatamente
    setPrefs((p) => ({ ...p, [key]: value }))

    // Persistir no backend
    try {
      await fetch('/api/preferences', {
        method:      'PATCH',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ [key]: value }),
      })
    } catch (e) {
      // Rollback optimista se falhar
      setPrefs((p) => ({ ...p, [key]: initial[key] }))
      // eslint-disable-next-line no-console
      console.error('[usePreferences] Falha ao salvar:', e)
    }
  }, [initial])

  return { prefs, updatePref } as const
}
