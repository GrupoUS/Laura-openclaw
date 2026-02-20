'use client'
import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

function LoginContent() {
  const router       = useRouter()
  const params       = useSearchParams()
  const from         = params.get('from') ?? '/board'
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(from)
      router.refresh()   // invalida cache do Server Component
    } else {
      const { error: msg } = await res.json()
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">🧠</p>
          <h1 className="text-xl font-bold text-slate-900">Laura Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Sistema de Tarefas · Grupo US</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
              Senha de acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200
                          rounded-lg px-3 py-2 flex items-center gap-1.5">
              <span>⚠️</span> {error}
            </p>
          )}

          <Button type="submit" disabled={loading || !password} className="w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span> Entrando...
              </span>
            ) : (
              '→ Entrar'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Sistema interno · Grupo US
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-2xl">⟳</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
