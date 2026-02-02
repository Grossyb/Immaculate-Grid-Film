interface GameStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  totalRarity?: number
  totalSteps?: number
}

interface GameStatsModalProps {
  gameName: string
  stats: GameStats
  onClose: () => void
}

export function GameStatsModal({ gameName, stats, onClose }: GameStatsModalProps) {
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0

  const avgRarity = stats.gamesPlayed > 0 && stats.totalRarity
    ? Math.round(stats.totalRarity / stats.gamesPlayed)
    : null

  const avgSteps = stats.gamesWon > 0 && stats.totalSteps
    ? (stats.totalSteps / stats.gamesWon).toFixed(1)
    : null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] rounded-xl p-6 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[#e5e5e5] text-center mb-1">{gameName}</h2>
        <p className="text-xs text-[#525252] text-center mb-6 uppercase tracking-wider">Statistics</p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <Stat value={stats.gamesPlayed} label="Played" />
          <Stat value={`${winRate}%`} label="Win %" />
          <Stat value={stats.currentStreak} label="Streak" />
          <Stat value={stats.maxStreak} label="Best" />
        </div>

        {avgRarity !== null && (
          <div className="text-center mb-6 py-4 bg-white/[0.03] rounded-lg">
            <p className="text-xs text-[#525252] uppercase tracking-wider mb-1">Avg Rarity</p>
            <p className="text-2xl font-bold text-[#d4af37]">{avgRarity}</p>
          </div>
        )}

        {avgSteps !== null && (
          <div className="text-center mb-6 py-4 bg-white/[0.03] rounded-lg">
            <p className="text-xs text-[#525252] uppercase tracking-wider mb-1">Avg Steps</p>
            <p className="text-2xl font-bold text-[#d4af37]">{avgSteps}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg text-sm text-[#e5e5e5] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-[#e5e5e5]">{value}</p>
      <p className="text-[10px] text-[#525252] uppercase tracking-wider">{label}</p>
    </div>
  )
}
