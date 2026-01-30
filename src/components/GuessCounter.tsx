interface GuessCounterProps {
  remaining: number
}

export function GuessCounter({ remaining }: GuessCounterProps) {
  const total = 9
  const used = total - remaining

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Guesses:</span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < used ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{remaining}</span>
    </div>
  )
}
