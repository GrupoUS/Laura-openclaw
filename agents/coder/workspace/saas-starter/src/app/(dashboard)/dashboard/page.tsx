export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-400">Total Revenue</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-400"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">$45,231.89</div>
          <p className="text-xs text-slate-500">+20.1% from last month</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-400">Subscriptions</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-400"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">+2350</div>
          <p className="text-xs text-slate-500">+180.1% from last month</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-400">Sales</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-400"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">+12,234</div>
          <p className="text-xs text-slate-500">+19% from last month</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-400">Active Now</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-400"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white">+573</div>
          <p className="text-xs text-slate-500">+201 since last hour</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
           <h3 className="text-lg font-medium text-white mb-4">Overview</h3>
           <div className="h-[200px] w-full bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500">
             [Chart Placeholder]
           </div>
        </div>
        <div className="col-span-3 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
           <h3 className="text-lg font-medium text-white mb-4">Recent Sales</h3>
           <div className="space-y-4">
             <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xs">OM</div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none text-white">Olivia Martin</p>
                  <p className="text-xs text-slate-500">olivia.martin@email.com</p>
                </div>
                <div className="ml-auto font-medium text-white">+$1,999.00</div>
             </div>
             <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xs">JL</div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none text-white">Jackson Lee</p>
                  <p className="text-xs text-slate-500">jackson.lee@email.com</p>
                </div>
                <div className="ml-auto font-medium text-white">+$39.00</div>
             </div>
             <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xs">IN</div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none text-white">Isabella Nguyen</p>
                  <p className="text-xs text-slate-500">isabella.nguyen@email.com</p>
                </div>
                <div className="ml-auto font-medium text-white">+$299.00</div>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
