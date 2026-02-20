"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to Sentry/monitoring here
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-red-900/20 p-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Something went wrong!</h1>
        <p className="max-w-[600px] text-slate-400 md:text-xl">
          We encountered an unexpected error. Our team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-slate-900 shadow transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
