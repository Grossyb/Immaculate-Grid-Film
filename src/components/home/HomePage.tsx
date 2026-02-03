import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameStatsModal } from './GameStatsModal'
import { useGameStats } from '../../hooks/useGameStats'
import { useGamePreviews } from '../../hooks/useGamePreviews'
import { getCoStarsStats } from '../../lib/stats'
import type { GameType } from '../../lib/types'

function getGameStats(gameType: GameType) {
  if (gameType === 'costars') {
    return getCoStarsStats()
  }
  try {
    const key = gameType === 'filmography' ? 'filmography-stats' : 'sixdegrees-stats'
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
  }
}

export function HomePage() {
  const navigate = useNavigate()
  const { gameCards } = useGameStats()
  const previews = useGamePreviews()
  const [statsModal, setStatsModal] = useState<{ gameType: GameType; gameName: string } | null>(null)

  const handlePlay = (route: string) => {
    navigate(route)
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16">
      {/* Header */}
      <header className="mb-12 sm:mb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#e5e5e5] mb-3">
          Daily Rewind
        </h1>
        <p className="text-[#737373] text-base tracking-wide">A new puzzle every day</p>
      </header>

      {/* Game Cards */}
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {/* Co-Stars Card */}
          <GameCard
            name="Co-Stars"
            description="Find movies connecting actors"
            played={gameCards[0]?.playedToday}
            won={gameCards[0]?.wonToday}
            streak={gameCards[0]?.currentStreak}
            onPlay={() => handlePlay('/costars')}
            onStatsClick={() => setStatsModal({ gameType: 'costars', gameName: 'Co-Stars' })}
          >
            <div className="flex -space-x-3 mb-6 h-14">
              {previews.costars.actors.slice(0, 5).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border-[3px] border-[#0a0a0a] hover:scale-110 hover:z-10 transition-transform"
                />
              ))}
            </div>
          </GameCard>

          {/* Filmography Card */}
          <GameCard
            name="Filmography"
            description="Guess the actor from their films"
            played={gameCards[1]?.playedToday}
            won={gameCards[1]?.wonToday}
            streak={gameCards[1]?.currentStreak}
            onPlay={() => handlePlay('/filmography')}
            onStatsClick={() => setStatsModal({ gameType: 'filmography', gameName: 'Filmography' })}
          >
            <div className="flex gap-1.5 mb-6 h-14 items-center">
              {previews.filmography.movies.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-10 h-14 rounded-md object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all"
                />
              ))}
              <div className="w-10 h-14 rounded-md bg-white/10 flex items-center justify-center border border-dashed border-white/20">
                <span className="text-[#d4af37] text-xl font-light">?</span>
              </div>
            </div>
          </GameCard>

          {/* Six Degrees Card */}
          <GameCard
            name="Six Degrees"
            description="Connect two actors via movies"
            played={gameCards[2]?.playedToday}
            won={gameCards[2]?.wonToday}
            streak={gameCards[2]?.currentStreak}
            onPlay={() => handlePlay('/sixdegrees')}
            onStatsClick={() => setStatsModal({ gameType: 'sixdegrees', gameName: 'Six Degrees' })}
          >
            <div className="flex items-center gap-3 mb-6 h-14">
              {previews.sixdegrees.startActor && (
                <img
                  src={previews.sixdegrees.startActor}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/50"
                />
              )}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#525252] rounded-full"></span>
                  <span className="w-1.5 h-1.5 bg-[#525252] rounded-full"></span>
                  <span className="w-1.5 h-1.5 bg-[#525252] rounded-full"></span>
                  <span className="w-8 h-px bg-gradient-to-r from-[#525252] to-[#d4af37]"></span>
                  <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full"></span>
                </div>
              </div>
              {previews.sixdegrees.endActor && (
                <img
                  src={previews.sixdegrees.endActor}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-[#d4af37]/50"
                />
              )}
            </div>
          </GameCard>
        </div>
      </div>

      {/* Stats Modal */}
      {statsModal && (
        <GameStatsModal
          gameName={statsModal.gameName}
          stats={getGameStats(statsModal.gameType)}
          onClose={() => setStatsModal(null)}
        />
      )}
    </div>
  )
}

interface GameCardProps {
  name: string
  description: string
  played?: boolean
  won?: boolean
  streak?: number
  onPlay: () => void
  onStatsClick: () => void
  children: React.ReactNode
}

function GameCard({ name, description, played, won, streak, onPlay, onStatsClick, children }: GameCardProps) {
  return (
    <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl transition-all duration-300 border border-white/[0.05] hover:border-white/[0.1] p-6 sm:p-7">
      {/* Played Today Badge */}
      {played && (
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            won
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-white/10 text-[#a3a3a3]'
          }`}>
            {won ? '✓ Done' : 'Played'}
          </span>
        </div>
      )}

      {/* Preview Images */}
      <div className="mt-4">
        {children}
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-[#e5e5e5] mb-1.5">{name}</h2>

      {/* Description */}
      <p className="text-sm text-[#737373] mb-5 leading-relaxed">{description}</p>

      {/* Bottom Row: Play Button + Streak + Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onPlay}
            className={`
              px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${played
                ? won
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-[#a3a3a3] hover:bg-white/15'
                : 'bg-[#d4af37] text-black hover:bg-[#e5c349] hover:scale-105 active:scale-100'
              }
            `}
          >
            {played ? (won ? 'View' : 'View') : 'Play →'}
          </button>

          {(streak ?? 0) > 0 && (
            <span className="text-sm text-[#d4af37] font-medium flex items-center gap-1">
              <span className="text-base">🔥</span>
              {streak}
            </span>
          )}
        </div>

        {/* Stats Button - Always Visible */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStatsClick()
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[#737373] hover:text-[#e5e5e5] hover:bg-white/[0.05] rounded-lg transition-all text-sm"
        >
          <span>Stats</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
