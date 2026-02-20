'use client'
import { AGENT_EMOJIS } from '@/types/tasks'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Props { agent: string | null; size?: 'sm' | 'md' }

export function AgentBadge({ agent, size = 'md' }: Props) {
  const name  = agent ?? 'system'
  const emoji = AGENT_EMOJIS[name] ?? name.charAt(0).toUpperCase()
  const cls   = size === 'sm' ? 'text-xs w-5 h-5' : 'text-sm w-7 h-7'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${cls} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-medium cursor-default select-none`}>
            {emoji}
          </span>
        </TooltipTrigger>
        <TooltipContent><p>@{name}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
