import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-slate-900 p-4">
          <AlertCircle className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
        <p className="max-w-[600px] text-slate-400 md:text-xl">
          Page not found. The resource you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
