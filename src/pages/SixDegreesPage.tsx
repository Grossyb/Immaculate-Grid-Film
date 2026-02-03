import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  generateDailySixDegrees,
  getActorMovies,
  getMovieActors,
} from '../lib/sixdegrees-generator'
import { useSixDegreesState } from '../hooks/useSixDegreesState'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { markGamePlayedToday } from '../lib/stats'
import type { Actor, Movie } from '../lib/types'

export function SixDegreesPage() {
  const puzzle = useMemo(() => generateDailySixDegrees(), [])
  const {
    path,
    isComplete,
    won,
    needsMovie,
    currentActor,
    currentMovie,
    stepsTaken,
    selectMovie,
    selectActor,
    undo,
    reset,
  } = useSixDegreesState(puzzle)

  const [searchQuery, setSearchQuery] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [copied, setCopied] = useState(false)

  const [stats, setStats] = useLocalStorage('sixdegrees-stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalSteps: 0,
  })

  const [hasTrackedCompletion, setHasTrackedCompletion] = useLocalStorage(
    `sixdegrees-tracked-${puzzle.date}`,
    false
  )

  useEffect(() => {
    if (isComplete && won && !hasTrackedCompletion) {
      setStats(prev => ({
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + 1,
        currentStreak: prev.currentStreak + 1,
        maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
        totalSteps: prev.totalSteps + stepsTaken,
      }))
      markGamePlayedToday('sixdegrees', won)
      setHasTrackedCompletion(true)
    }
  }, [isComplete, won, hasTrackedCompletion, stepsTaken])

  // Get available options based on current state
  const availableMovies = useMemo(() => {
    if (!needsMovie || !currentActor) return []
    return getActorMovies(currentActor.id).slice(0, 20)
  }, [needsMovie, currentActor])

  const availableActors = useMemo(() => {
    if (needsMovie || !currentMovie) return []
    return getMovieActors(currentMovie.id).filter(a => {
      // Don't show actors already in the path (except the target)
      const inPath = path.some(step => step.actor?.id === a.id)
      return !inPath || a.id === puzzle.endActor.id
    })
  }, [needsMovie, currentMovie, path, puzzle.endActor.id])

  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return availableMovies
    const lower = searchQuery.toLowerCase()
    return availableMovies.filter(m => m.title.toLowerCase().includes(lower))
  }, [searchQuery, availableMovies])

  const handleSelectMovie = (movie: Movie) => {
    selectMovie(movie)
    setSearchQuery('')
  }

  const handleSelectActor = (actor: Actor) => {
    selectActor(actor)
    setSearchQuery('')
  }

  const shareText = `Six Degrees #${puzzle.puzzleNumber}\n🔗 Connected in ${stepsTaken} steps!\n\nPlay at: dailyrewind.app`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0
  const avgSteps = stats.gamesWon > 0 ? (stats.totalSteps / stats.gamesWon).toFixed(1) : '-'

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6">
      {/* Back to Home */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#a3a3a3] hover:text-[#e5e5e5] transition-colors rounded-lg hover:bg-white/[0.05]"
        >
          <span className="text-lg">←</span>
          <span>Home</span>
        </Link>
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

      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e5e5e5] mb-1">
          Six Degrees #{puzzle.puzzleNumber}
        </h1>
        <p className="text-[#737373] text-sm">Connect the actors via shared movies</p>
      </header>

      {/* Target Display */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex items-center justify-between gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
          {/* Start Actor */}
          <div className="flex flex-col items-center text-center flex-1">
            {puzzle.startActor.profilePath && (
              <img
                src={`https://image.tmdb.org/t/p/w185${puzzle.startActor.profilePath}`}
                alt={puzzle.startActor.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-2 ring-2 ring-emerald-500/50"
              />
            )}
            <span className="text-sm font-medium text-[#e5e5e5]">{puzzle.startActor.name}</span>
            <span className="text-xs text-emerald-400">Start</span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center">
            <div className="text-2xl text-[#525252]">→</div>
            <div className="text-xs text-[#525252] mt-1">{stepsTaken} steps</div>
          </div>

          {/* End Actor */}
          <div className="flex flex-col items-center text-center flex-1">
            {puzzle.endActor.profilePath && (
              <img
                src={`https://image.tmdb.org/t/p/w185${puzzle.endActor.profilePath}`}
                alt={puzzle.endActor.name}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-2 ring-2 ${
                  won ? 'ring-emerald-500/50' : 'ring-[#d4af37]/50'
                }`}
              />
            )}
            <span className="text-sm font-medium text-[#e5e5e5]">{puzzle.endActor.name}</span>
            <span className="text-xs text-[#d4af37]">Target</span>
          </div>
        </div>
      </div>

      {/* Current Path */}
      <div className="w-full max-w-xl mb-6">
        <h3 className="text-sm text-[#737373] mb-3">Your path:</h3>
        <div className="flex flex-wrap items-center gap-2">
          {path.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-[#525252]">→</span>}
              {step.type === 'actor' && step.actor && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  {step.actor.profilePath && (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${step.actor.profilePath}`}
                      alt={step.actor.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm text-[#e5e5e5]">{step.actor.name}</span>
                </div>
              )}
              {step.type === 'movie' && step.movie && (
                <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  <span className="text-sm text-[#e5e5e5]">{step.movie.title}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selection Area */}
      {!isComplete && (
        <div className="w-full max-w-xl mb-6">
          {needsMovie ? (
            <>
              <h3 className="text-sm text-[#737373] mb-3">
                Select a movie with <span className="text-[#e5e5e5]">{currentActor?.name}</span>:
              </h3>
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="w-full px-4 py-2.5 mb-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[#e5e5e5] placeholder-[#525252] focus:border-[#d4af37]/50 focus:outline-none transition-colors"
              />
              {/* Movie Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {filteredMovies.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-left transition-colors border border-white/[0.05] hover:border-white/[0.1]"
                  >
                    <div className="text-sm font-medium text-[#e5e5e5] truncate">{movie.title}</div>
                    <div className="text-xs text-[#737373]">{movie.releaseYear}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm text-[#737373] mb-3">
                Select an actor from <span className="text-[#e5e5e5]">{currentMovie?.title}</span>:
              </h3>
              {/* Actor Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableActors.map((actor) => {
                  const isTarget = actor.id === puzzle.endActor.id
                  return (
                    <button
                      key={actor.id}
                      onClick={() => handleSelectActor(actor)}
                      className={`p-3 rounded-lg text-left transition-colors border flex items-center gap-2 ${
                        isTarget
                          ? 'bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border-[#d4af37]/30 hover:border-[#d4af37]/50'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05] hover:border-white/[0.1]'
                      }`}
                    >
                      {actor.profilePath && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${actor.profilePath}`}
                          alt={actor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-[#e5e5e5]">{actor.name}</div>
                        {isTarget && (
                          <div className="text-xs text-[#d4af37]">Target!</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      {!isComplete && path.length > 1 && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={undo}
            className="px-5 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-sm text-[#e5e5e5] transition-colors"
          >
            Undo
          </button>
          <button
            onClick={reset}
            className="px-5 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-sm text-[#e5e5e5] transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Game Complete */}
      {isComplete && won && (
        <div className="w-full max-w-xl text-center">
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-[#e5e5e5] mb-2">Connected!</h2>
            <p className="text-[#a3a3a3]">
              You connected them in <span className="font-bold text-[#e5e5e5]">{stepsTaken}</span> steps!
            </p>
            {stepsTaken <= puzzle.optimalPath && (
              <p className="text-emerald-400 text-sm mt-2">
                That's the optimal path!
              </p>
            )}
            <button
              onClick={handleShare}
              className="mt-4 px-6 py-2.5 bg-[#d4af37] text-black hover:bg-[#e5c349] rounded-lg font-semibold transition-colors"
            >
              {copied ? 'Copied!' : 'Share Result'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowStats(false)}>
          <div className="bg-[#141414] rounded-xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-[#e5e5e5] text-center mb-1">Six Degrees</h2>
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
              <p className="text-xs text-[#525252] uppercase tracking-wider mb-1">Avg Steps</p>
              <p className="text-2xl font-bold text-[#d4af37]">{avgSteps}</p>
            </div>

            <button
              onClick={() => setShowStats(false)}
              className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg text-sm text-[#e5e5e5] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
