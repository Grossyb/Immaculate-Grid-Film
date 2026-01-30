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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-6 text-center">Statistics</h2>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
            <p className="text-xs text-gray-400">Played</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-gray-400">Win %</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs text-gray-400">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.maxStreak}</p>
            <p className="text-xs text-gray-400">Max</p>
          </div>
        </div>

        <div className="text-center mb-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">Average Rarity Score</p>
          <p className="text-3xl font-bold text-purple-400">{avgRarity}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  )
}
