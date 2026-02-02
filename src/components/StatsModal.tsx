import type { PlayerStats } from '../lib/types'

interface StatsModalProps {
  stats: PlayerStats
  onClose: () => void
}

export function StatsModal({ stats, onClose }: StatsModalProps) {
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0

  const avgRarity = stats.gamesPlayed > 0
    ? Math.round(stats.totalRarity / stats.gamesPlayed)
    : 0

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] rounded-xl p-6 max-w-xs w-full border border-white/[0.08]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[#e5e5e5] text-center mb-1">Co-Stars</h2>
        <p className="text-xs text-[#525252] text-center mb-6 uppercase tracking-wider">Statistics</p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#e5e5e5]">{stats.gamesPlayed}</p>
            <p className="text-[10px] text-[#525252] uppercase tracking-wider">Played</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#e5e5e5]">{winRate}%</p>
            <p className="text-[10px] text-[#525252] uppercase tracking-wider">Win %</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#e5e5e5]">{stats.currentStreak}</p>
            <p className="text-[10px] text-[#525252] uppercase tracking-wider">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#e5e5e5]">{stats.maxStreak}</p>
            <p className="text-[10px] text-[#525252] uppercase tracking-wider">Best</p>
          </div>
        </div>

        <div className="text-center mb-6 py-4 bg-white/[0.03] rounded-lg">
          <p className="text-xs text-[#525252] uppercase tracking-wider mb-1">Avg Rarity</p>
          <p className="text-2xl font-bold text-[#d4af37]">{avgRarity}</p>
        </div>

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
