import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Settings, CreditCard, LogOut } from "lucide-react"

import { auth, signOut } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-950 text-slate-50">
      <aside className="w-full md:w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col">
        <div className="mb-8 flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            S
          </div>
          <span>SaaS Starter</span>
        </div>
        <nav className="flex-1 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-white hover:bg-slate-800"
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/billing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-white hover:bg-slate-800"
          >
            <CreditCard className="h-5 w-5" />
            Billing
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-white hover:bg-slate-800"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </nav>
        <div className="border-t border-slate-800 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-4 px-3">
             <div className="h-8 w-8 rounded-full bg-slate-700 overflow-hidden">
                {session.user?.image ? (
                  <img src={session.user.image} alt="User" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs">
                    {session.user?.name?.[0] || "U"}
                  </div>
                )}
             </div>
             <div className="text-sm overflow-hidden">
               <div className="font-medium truncate">{session.user?.name || "User"}</div>
               <div className="text-xs text-slate-400 truncate">{session.user?.email}</div>
             </div>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-400 transition-all hover:text-red-300 hover:bg-red-950/30">
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
