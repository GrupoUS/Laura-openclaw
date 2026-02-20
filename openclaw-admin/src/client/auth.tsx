import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type AuthState = {
  authenticated: boolean
  loading: boolean
  login: (password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check', { credentials: 'include' })
      const data = await res.json()
      setAuthenticated(data.authenticated === true)
    } catch {
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'include'
    })
    const data = await res.json()
    if (data.ok) {
      setAuthenticated(true)
      return { ok: true }
    }
    return { ok: false, error: data.error || 'Login failed' }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    setAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
