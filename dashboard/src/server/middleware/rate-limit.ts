const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, maxAttempts = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= maxAttempts
}
