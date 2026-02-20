import { Metadata } from "next"
import { PricingTable } from "@/components/pricing-table"

export const metadata: Metadata = {
  title: "Pricing | SaaS Starter",
  description: "Choose your plan",
}

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50">
      <main className="flex-1 py-24">
        <div className="container px-4 md:px-6 mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="max-w-[700px] mx-auto text-slate-400 md:text-xl">
            Choose the plan that fits your needs. No hidden fees. Cancel anytime.
          </p>
        </div>
        <PricingTable />
      </main>
    </div>
  )
}
