interface MonitorProps {
  active: boolean
  standby: boolean
  screenText?: string
}

export function Monitor({ active, standby, screenText }: MonitorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Screen */}
      <div
        className={`w-20 h-14 rounded-sm border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 relative ${
          active
            ? 'border-emerald-500/80 bg-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
            : standby
              ? 'border-amber-500/60 bg-slate-950 shadow-[0_0_6px_rgba(234,179,8,0.2)]'
              : 'border-slate-700 bg-slate-900'
        }`}
      >
        {active && screenText && (
          <div className="w-full h-full flex flex-col p-1 gap-0.5">
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
            {/* Task text on screen */}
            <div className="flex-1 overflow-hidden">
              <p
                className="text-[7px] leading-[9px] text-emerald-400/90 font-mono break-words animate-[monitorScroll_8s_linear_infinite]"
                style={{ WebkitLineClamp: 5, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
              >
                {screenText}
              </p>
            </div>
            {/* Blinking cursor line */}
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-[6px] text-emerald-500/60 font-mono">&gt;</span>
              <div className="w-1 h-2 bg-emerald-400 animate-[cursorBlink_1s_step-end_infinite]" />
            </div>
          </div>
        )}
        {active && !screenText && (
          <div className="w-16 h-10 overflow-hidden rounded-sm relative">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
            <div className="flex flex-col gap-[3px] p-1 animate-pulse">
              <div className="h-[2px] bg-emerald-400/70 rounded w-full" />
              <div className="h-[2px] bg-emerald-400/40 rounded w-4/5" />
              <div className="h-[2px] bg-emerald-400/60 rounded w-full" />
              <div className="h-[2px] bg-emerald-400/30 rounded w-3/5" />
              <div className="h-[2px] bg-emerald-400/50 rounded w-full" />
              <div className="h-[2px] bg-emerald-400/20 rounded w-2/3" />
            </div>
          </div>
        )}
        {standby && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50 animate-pulse" />
            <span className="text-[6px] text-amber-500/40 font-mono">STANDBY</span>
          </div>
        )}
        {!active && !standby && (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        )}
      </div>
      {/* Stand */}
      <div className="w-3 h-2 bg-slate-600 rounded-sm" />
      <div className="w-10 h-0.5 bg-slate-600 rounded" />
    </div>
  )
}
