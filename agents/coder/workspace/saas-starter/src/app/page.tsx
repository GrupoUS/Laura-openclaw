import Link from "next/link"
import { ArrowRight, CheckCircle2, Globe, Shield, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      {/* Navbar */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center font-bold text-xl text-white" href="#">
          <Zap className="h-6 w-6 mr-2 text-blue-500" />
          SaaS<span className="text-blue-500">Starter</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-blue-400 transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-blue-400 transition-colors" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:text-blue-400 transition-colors" href="/login">
            Login
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex justify-center items-center text-center px-4">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-slate-800 px-3 py-1 text-sm text-blue-400 mb-4">
                  New v1.0 Released
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Launch Your SaaS in Minutes, Not Months
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-400 md:text-xl">
                  The complete starter kit with Auth, Payments, Database, and Email built-in. Stop reinventing the wheel.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 disabled:pointer-events-none disabled:opacity-50"
                  href="/register"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-800 bg-slate-950 px-8 text-sm font-medium shadow-sm transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50"
                  href="https://github.com"
                >
                  GitHub
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-slate-900 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-slate-950 rounded-xl border border-slate-800">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Secure Auth</h2>
                <p className="text-slate-400">
                  Pre-configured NextAuth v5 with Google & Email providers. Secure by default.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-slate-950 rounded-xl border border-slate-800">
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <Globe className="h-8 w-8 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Global CDN</h2>
                <p className="text-slate-400">
                  Deployed on Vercel Edge Network for lightning fast performance worldwide.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-slate-950 rounded-xl border border-slate-800">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Stripe Ready</h2>
                <p className="text-slate-400">
                  Complete subscription flow with webhooks and customer portal integration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 flex justify-center">
           <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Simple Pricing</h2>
                <p className="max-w-[900px] text-slate-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Start free, upgrade when you grow.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
               <div className="flex flex-col p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-colors">
                  <h3 className="text-xl font-bold text-white">Hobby</h3>
                  <div className="mt-4 text-4xl font-bold text-white">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <ul className="mt-6 space-y-2 text-slate-400">
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-blue-500"/> 1 User</li>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-blue-500"/> 5 Projects</li>
                    <li className="flex items-center"><CheckCircle2 className="mr-2 h-4 w-4 text-blue-500"/> Community Support</li>
                  </ul>
                  <Link href="/register" className="mt-8 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded transition-colors text-center block">
                    Get Started
                  </Link>
               </div>
               <div className="flex flex-col p-6 bg-slate-950 rounded-xl border border-blue-600 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-bl">POPULAR</div>
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <div className=\"mt-4 text-4xl font-bold text-white\">$29<span className=\"text-lg text-slate-500 font-normal\">/mo</span></div>
                  <ul className=\"mt-6 space-y-2 text-slate-400\">
                    <li className=\"flex items-center\"><CheckCircle2 className=\"mr-2 h-4 w-4 text-blue-500\"/> Unlimited Users</li>
                    <li className=\"flex items-center\"><CheckCircle2 className=\"mr-2 h-4 w-4 text-blue-500\"/> Unlimited Projects</li>
                    <li className=\"flex items-center\"><CheckCircle2 className=\"mr-2 h-4 w-4 text-blue-500\"/> Priority Support</li>
                  </ul>
                   <Link href="/pricing" className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors text-center block">
                    Upgrade to Pro
                  </Link>
               </div>
            </div>
           </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-slate-800 bg-slate-950">
        <p className="text-xs text-slate-500">© 2026 SaaS Starter Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-slate-500 hover:text-slate-300" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-slate-500 hover:text-slate-300" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
