interface AgentAvatarProps {
  emoji: string
  name: string
  status: 'active' | 'standby' | 'idle'
}

export function AgentAvatar({ emoji, name, status }: AgentAvatarProps) {
  const statusRing =
    status === 'active'
      ? 'ring-2 ring-green-400'
      : status === 'standby'
        ? 'ring-2 ring-yellow-400'
        : 'ring-1 ring-slate-600'

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl ${statusRing} transition-all duration-300`}
        title={name}
      >
        {emoji}
      </div>
      {status === 'active' && (
        <div className="flex gap-0.5 items-end h-3">
          {(['b1', 'b2', 'b3', 'b4', 'b5'] as const).map((key, i) => {
            const heights = [1, 2, 3, 2, 1]
            return (
              <div
                key={key}
                className="w-0.5 bg-green-400 rounded-full animate-pulse"
                style={{
                  height: `${(heights[i] ?? 1) * 4}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
