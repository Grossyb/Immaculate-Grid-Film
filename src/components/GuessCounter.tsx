interface GuessCounterProps {
  remaining: number
}

export function GuessCounter({ remaining }: GuessCounterProps) {
  const total = 9
  const used = total - remaining

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#737373]">Guesses:</span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < used ? 'bg-red-500/60' : 'bg-emerald-500'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-[#e5e5e5]">{remaining}</span>
    </div>
  )
}
