"use client"

import { useState, useTransition } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createCheckoutSession } from "@/lib/actions"

export function PricingTable() {
  const [isYearly, setIsYearly] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleUpgrade = () => {
    // In a real app, use the actual Stripe Price ID
    const priceId = isYearly ? "price_yearly_id" : "price_monthly_id"
    
    startTransition(async () => {
      try {
        await createCheckoutSession(priceId)
      } catch (error) {
        console.error("Stripe error:", error)
        // Ideally show a toast here
      }
    })
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* ... toggle code remains same ... */}
      <div className="flex justify-center mb-10">
        <div className="bg-slate-900 p-1 rounded-full flex items-center border border-slate-800">
           <button
             onClick={() => setIsYearly(false)}
             className={cn(
               "px-6 py-2 rounded-full text-sm font-medium transition-all",
               !isYearly ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
             )}
           >
             Monthly
           </button>
           <button
             onClick={() => setIsYearly(true)}
             className={cn(
               "px-6 py-2 rounded-full text-sm font-medium transition-all",
               isYearly ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
             )}
           >
             Yearly <span className="ml-1 text-xs text-blue-200 font-normal">-20%</span>
           </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Free Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col">
          {/* ... content same ... */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white">Hobby</h3>
            <p className="text-slate-400 mt-2 text-sm">Perfect for side projects and learning.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-slate-500 ml-2">/ month</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-slate-300 text-sm">
              <Check className="h-4 w-4 text-blue-500 mr-3 shrink-0" />
              1 User
            </li>
            <li className="flex items-center text-slate-300 text-sm">
              <Check className="h-4 w-4 text-blue-500 mr-3 shrink-0" />
              5 Projects
            </li>
            <li className="flex items-center text-slate-300 text-sm">
              <Check className="h-4 w-4 text-blue-500 mr-3 shrink-0" />
              Community Support
            </li>
             <li className="flex items-center text-slate-500 text-sm line-through">
              <X className="h-4 w-4 mr-3 shrink-0" />
              Advanced Analytics
            </li>
          </ul>
          <button className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700">
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-950 border border-blue-600 rounded-2xl p-8 flex flex-col relative shadow-xl shadow-blue-900/10">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
            MOST POPULAR
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white">Pro</h3>
            <p className="text-slate-400 mt-2 text-sm">For serious developers and teams.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">
              ${isYearly ? "290" : "29"}
            </span>
            <span className="text-slate-500 ml-2">/ {isYearly ? "year" : "month"}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-slate-300 text-sm">
              <Check className="h-4 w-4 text-blue-500 mr-3 shrink-0" />
              Unlimited Users
            </li>
            <li className="flex items-center text-slate-300 text-sm">
              <Check className="h-4 w-4 text-blue-500 mr-3 shrink-0" />
              Unlimited Projects
            </li>
            <li className="flex items-center text-slate-300 text-sm">
              <Check className="h-4 w-4 text-blue-500 mr-3 shrink-0" />
              Priority Support
            </li>
            <li className="flex items-center text-slate-300 text-sm">
              <Check className="h-4 w-4 text-blue-500 mr-3 shrink-0" />
              Advanced Analytics
            </li>
          </ul>
          <button 
            onClick={handleUpgrade}
            disabled={isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Upgrade to Pro"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
