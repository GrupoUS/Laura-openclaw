interface MonitorProps {
  active: boolean
  standby: boolean
}

export function Monitor({ active, standby }: MonitorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Screen */}
      <div
        className={`w-14 h-10 rounded-sm border-2 flex items-center justify-center transition-all duration-500 ${
          active
            ? 'border-green-400 bg-green-950 shadow-[0_0_8px_rgba(74,222,128,0.5)]'
            : standby
              ? 'border-yellow-500 bg-yellow-950/50 shadow-[0_0_4px_rgba(234,179,8,0.3)]'
              : 'border-slate-700 bg-slate-900'
        }`}
      >
        {active && (
          <div className="w-10 h-7 overflow-hidden rounded-sm">
            <div className="flex flex-col gap-0.5 p-0.5 animate-pulse">
              <div className="h-0.5 bg-green-400/70 rounded w-full" />
              <div className="h-0.5 bg-green-400/50 rounded w-4/5" />
              <div className="h-0.5 bg-green-400/70 rounded w-full" />
              <div className="h-0.5 bg-green-400/40 rounded w-3/5" />
              <div className="h-0.5 bg-green-400/60 rounded w-full" />
              <div className="h-0.5 bg-green-400/30 rounded w-2/3" />
            </div>
          </div>
        )}
        {standby && (
          <div className="w-2 h-2 rounded-full bg-yellow-400/60 animate-pulse" />
        )}
        {!active && !standby && (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        )}
      </div>
      {/* Stand */}
      <div className="w-3 h-2 bg-slate-600 rounded-sm" />
      <div className="w-8 h-0.5 bg-slate-600 rounded" />
    </div>
  )
}
