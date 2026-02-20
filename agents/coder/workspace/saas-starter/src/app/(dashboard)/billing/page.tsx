import { redirect } from "next/navigation"
import { Check, AlertTriangle, CreditCard } from "lucide-react"

import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default async function BillingPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // MOCK DATA: Simulate a free plan user
  const isPro = false 
  const planName = isPro ? "Pro" : "Hobby"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Billing</h3>
        <p className="text-sm text-slate-400">
          Manage your subscription and billing details.
        </p>
      </div>
      <div className="border-t border-slate-800" />
      
      <div className="grid gap-8">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                 <h4 className="text-lg font-medium text-white">Subscription Plan</h4>
                 <p className="text-sm text-slate-400">
                   You are currently on the <span className="font-bold text-white">{planName}</span> plan.
                 </p>
              </div>
              <button className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
                  isPro ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-blue-600 text-white hover:bg-blue-700"
              )}>
                {isPro ? "Manage Subscription" : "Upgrade to Pro"}
              </button>
           </div>
           {!isPro && (
             <div className="mt-6 rounded-md bg-blue-900/20 p-4 border border-blue-900/50">
               <div className="flex items-center gap-3">
                 <AlertTriangle className="h-5 w-5 text-blue-400" />
                 <p className="text-sm text-blue-200">
                   Your free trial ends in <span className="font-bold">14 days</span>. Upgrade now to keep advanced features.
                 </p>
               </div>
             </div>
           )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
           <div className="mb-4">
              <h4 className="text-lg font-medium text-white">Payment Method</h4>
              <p className="text-sm text-slate-400">
                Your default payment method.
              </p>
           </div>
           <div className="flex items-center gap-4 rounded-md border border-slate-800 bg-slate-950 p-4">
              <div className="rounded-full bg-slate-800 p-2">
                 <CreditCard className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex-1">
                 <p className="text-sm font-medium text-white">Visa ending in 4242</p>
                 <p className="text-xs text-slate-500">Expires 12/2028</p>
              </div>
              <button className="text-sm font-medium text-blue-500 hover:text-blue-400">
                Edit
              </button>
           </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
           <h4 className="text-lg font-medium text-white mb-4">Billing History</h4>
           <div className="rounded-md border border-slate-800 overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-950 text-slate-400">
                 <tr>
                   <th className="px-4 py-3 font-medium">Date</th>
                   <th className="px-4 py-3 font-medium">Amount</th>
                   <th className="px-4 py-3 font-medium">Status</th>
                   <th className="px-4 py-3 font-medium text-right">Invoice</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                 <tr className="hover:bg-slate-800/50">
                   <td className="px-4 py-3 text-slate-300">Oct 01, 2025</td>
                   <td className="px-4 py-3 text-white font-medium">$0.00</td>
                   <td className="px-4 py-3">
                     <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
                       Paid
                     </span>
                   </td>
                   <td className="px-4 py-3 text-right">
                     <button className="text-slate-400 hover:text-white">Download</button>
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  )
}
