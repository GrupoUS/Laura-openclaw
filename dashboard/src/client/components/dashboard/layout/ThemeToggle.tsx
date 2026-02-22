import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

// Ciclo: system → light → dark → system
const CYCLE: Record<string, { next: string; icon: string; label: string }> = {
  system: { next: 'light',  icon: '🖥️',  label: 'Sistema (automático)' },
  light:  { next: 'dark',   icon: '☀️',  label: 'Claro'                },
  dark:   { next: 'system', icon: '🌙',  label: 'Escuro'               },
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // Evitar hydration mismatch — renderizar apenas no client
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Placeholder do mesmo tamanho para evitar layout shift
    return <span className="w-8 h-8 rounded-md inline-block" />
  }

  const current  = theme ?? 'system'
  const cfg      = CYCLE[current] ?? CYCLE.system

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTheme(cfg.next)}
            className="w-8 h-8 rounded-md flex items-center justify-center
                       hover:bg-slate-100 dark:hover:bg-slate-800
                       transition-colors text-base"
            aria-label={`Tema atual: ${cfg.label}. Clique para trocar.`}
          >
            {cfg.icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{cfg.label} — clique para trocar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
