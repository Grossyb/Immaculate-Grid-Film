import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid } from '../components/Grid'
import { MovieSearch } from '../components/MovieSearch'
import { GuessCounter } from '../components/GuessCounter'
import { ShareModal } from '../components/ShareModal'
import { StatsModal } from '../components/StatsModal'
import { generateDailyGrid, getPuzzleNumber } from '../lib/grid-generator'
import { useGameState } from '../hooks/useGameState'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Movie } from '../lib/types'

export function CoStarsPage() {
  const navigate = useNavigate()
  const [showShare, setShowShare] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Memoize to prevent re-generation on every render
  const dailyGrid = useMemo(() => generateDailyGrid(), [])
  const {
    grid,
    selectedCell,
    guessesRemaining,
    isComplete,
    score,
    selectCell,
    makeGuess,
    useHint,
    currentCellHint,
  } = useGameState(dailyGrid)

  // Use new key 'costars-stats' for accurate daily tracking
  // Old 'immaculate-grid-stats' had bugs that inflated numbers
  const [stats, setStats] = useLocalStorage('costars-stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalRarity: 0,
  })

  const [hasTrackedCompletion, setHasTrackedCompletion] = useLocalStorage(
    `costars-tracked-${dailyGrid.date}`,
    false
  )

  useEffect(() => {
    if (isComplete && !hasTrackedCompletion) {
      const won = score.correct === 9
      setStats(prev => ({
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (won ? 1 : 0),
        currentStreak: won ? prev.currentStreak + 1 : 0,
        maxStreak: won ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
        totalRarity: prev.totalRarity + score.rarity,
      }))
      setHasTrackedCompletion(true)
      setShowShare(true)
    }
  }, [isComplete, hasTrackedCompletion, score])

  const handleMovieSelect = (movie: Movie) => {
    if (selectedCell) {
      makeGuess(movie)
    }
  }

  const handleGoHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-6">
      {/* Top bar with back link */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between">
        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#a3a3a3] hover:text-[#e5e5e5] transition-colors rounded-lg hover:bg-white/[0.05]"
        >
          <span className="text-lg">←</span>
          <span>Home</span>
        </button>
        <button
          onClick={() => setShowStats(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-[#a3a3a3] hover:text-[#e5e5e5] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg transition-all"
        >
          <span>Stats</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>

      <header className="mb-4 sm:mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e5e5e5] mb-1">Co-Stars #{getPuzzleNumber()}</h1>
        <p className="text-[#737373] text-sm hidden sm:block">Find movies connecting the actors</p>
      </header>

      <div className="mb-4 sm:mb-6">
        <GuessCounter remaining={guessesRemaining} />
      </div>

      <Grid
        rowActors={dailyGrid.rowActors}
        colActors={dailyGrid.colActors}
        grid={grid}
        selectedCell={selectedCell}
        onCellClick={selectCell}
        isComplete={isComplete}
      />

      {selectedCell && !isComplete && (
        <MovieSearch
          onSelect={handleMovieSelect}
          rowActor={dailyGrid.rowActors[selectedCell[0]]}
          colActor={dailyGrid.colActors[selectedCell[1]]}
          onUseHint={useHint}
          cellHint={currentCellHint}
        />
      )}

      {isComplete && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setShowShare(true)}
            className="px-6 py-3 bg-[#d4af37] text-black rounded-lg font-semibold hover:bg-[#e5c349] transition-colors"
          >
            Share Results
          </button>
        </div>
      )}

      {showShare && (
        <ShareModal
          grid={grid}
          score={score}
          onClose={() => setShowShare(false)}
        />
      )}

      {showStats && (
        <StatsModal
          stats={stats}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}
