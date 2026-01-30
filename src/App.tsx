import { useState, useEffect } from 'react'
import { Grid } from './components/Grid'
import { MovieSearch } from './components/MovieSearch'
import { GuessCounter } from './components/GuessCounter'
import { ShareModal } from './components/ShareModal'
import { StatsModal } from './components/StatsModal'
import { AdBanner } from './components/AdBanner'
import { generateDailyGrid, getPuzzleNumber } from './lib/grid-generator'
import { useGameState } from './hooks/useGameState'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { Movie } from './lib/types'

function App() {
  const [showShare, setShowShare] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const dailyGrid = generateDailyGrid()
  const {
    grid,
    selectedCell,
    guessesRemaining,
    isComplete,
    score,
    selectCell,
    makeGuess,
  } = useGameState(dailyGrid)

  const [stats, setStats] = useLocalStorage('immaculate-grid-stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalRarity: 0,
  })

  useEffect(() => {
    if (isComplete) {
      const won = score.correct === 9
      setStats(prev => ({
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (won ? 1 : 0),
        currentStreak: won ? prev.currentStreak + 1 : 0,
        maxStreak: won ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
        totalRarity: prev.totalRarity + score.rarity,
      }))
      setShowShare(true)
    }
  }, [isComplete])

  const handleMovieSelect = (movie: Movie) => {
    if (selectedCell) {
      makeGuess(movie)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-1">Immaculate Grid</h1>
        <p className="text-sm text-gray-500 mb-2">Movies Edition</p>
        <p className="text-lg font-semibold text-blue-400">#{getPuzzleNumber()}</p>
        <p className="text-gray-400 text-sm mt-1">A new puzzle every day. Find movies connecting the actors.</p>
      </header>

      <div className="flex gap-4 mb-4">
        <GuessCounter remaining={guessesRemaining} />
        <button
          onClick={() => setShowStats(true)}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Stats
        </button>
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
        />
      )}

      {isComplete && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setShowShare(true)}
            className="px-6 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-500"
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

      <AdBanner />
    </div>
  )
}

export default App
