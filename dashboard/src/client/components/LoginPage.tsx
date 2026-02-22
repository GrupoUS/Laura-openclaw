import React, { useState } from 'react'
import { useAuth } from '../auth'

export function LoginPage() {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(password)

    if (!result.ok) {
      setError(result.error || 'Invalid password')
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-neutral-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl"
      >
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">OpenClaw Admin</h1>
          <p className="text-sm text-neutral-500 mt-1">Enter password to connect</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Password Input */}
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-neutral-400 mb-2">
            Gateway Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
            placeholder="••••••"
            autoFocus
            autoComplete="current-password"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connecting...
            </span>
          ) : 'Connect to Gateway'}
        </button>
      </form>
    </div>
  )
}
