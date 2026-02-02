import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateDailyFilmography, searchActors } from '../lib/filmography-generator'
import { useFilmographyState } from '../hooks/useFilmographyState'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { markGamePlayedToday } from '../lib/stats'
import type { Actor } from '../lib/types'

export function FilmographyPage() {
  const navigate = useNavigate()
  const puzzle = useMemo(() => generateDailyFilmography(), [])
  const {
    guesses,
    revealedMovies,
    isComplete,
    won,
    guessesRemaining,
    makeGuess,
    revealHint,
    correctActor,
  } = useFilmographyState(puzzle)

  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [copied, setCopied] = useState(false)

  const [stats, setStats] = useLocalStorage('filmography-stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
  })

  const [hasTrackedCompletion, setHasTrackedCompletion] = useLocalStorage(
    `filmography-tracked-${puzzle.date}`,
    false
  )

  useEffect(() => {
    if (isComplete && !hasTrackedCompletion) {
      setStats(prev => ({
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (won ? 1 : 0),
        currentStreak: won ? prev.currentStreak + 1 : 0,
        maxStreak: won ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
      }))
      markGamePlayedToday('filmography', won)
      setHasTrackedCompletion(true)
    }
  }, [isComplete, won, hasTrackedCompletion])

  const handleGoHome = () => {
    navigate('/')
  }

  const searchResults = useMemo(() => {
    return searchActors(searchQuery)
  }, [searchQuery])

  const handleSelectActor = (actor: Actor) => {
    makeGuess(actor)
    setSearchQuery('')
    setShowResults(false)
  }

  const shareText = `Filmography #${puzzle.puzzleNumber}\n${won ? `🎭 Got it in ${guesses.length}!` : '😔 Failed'}\n\nPlay at: filmgames.app`

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

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6">
      {/* Back to Home */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between">
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

      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e5e5e5] mb-1">
          Filmography #{puzzle.puzzleNumber}
        </h1>
        <p className="text-[#737373] text-sm">Guess the actor from their films</p>
      </header>

      {/* Guesses Remaining */}
      <div className="flex items-center gap-2 mb-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < guessesRemaining
                ? 'bg-emerald-500'
                : 'bg-red-500/60'
            }`}
          />
        ))}
      </div>

      {/* Filmography List */}
      <div className="w-full max-w-xl mb-6">
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.05] overflow-hidden">
          <div className="p-3 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="grid grid-cols-12 text-xs text-[#737373] font-medium uppercase tracking-wider">
              <div className="col-span-7">Title</div>
              <div className="col-span-3 text-center">Year</div>
              <div className="col-span-2 text-right">Score</div>
            </div>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {puzzle.movies.map((movie, index) => {
              const isRevealed = index < revealedMovies || isComplete
              return (
                <div
                  key={movie.id}
                  className="p-3 grid grid-cols-12 items-center text-sm"
                >
                  <div className="col-span-7 font-medium text-[#e5e5e5]">
                    {isRevealed ? (
                      movie.title
                    ) : (
                      <span className="text-[#525252]">
                        {'?'.repeat(Math.min(movie.title.length, 20))}
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 text-center text-[#737373]">
                    {movie.releaseYear}
                  </div>
                  <div className="col-span-2 text-right text-[#737373]">
                    {Math.round(movie.popularity / 10)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hint Button */}
      {!isComplete && revealedMovies < puzzle.movies.length && (
        <button
          onClick={revealHint}
          className="mb-6 px-5 py-2.5 text-sm bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors text-[#e5e5e5]"
        >
          Reveal a title ({puzzle.movies.length - revealedMovies} remaining)
        </button>
      )}

      {/* Search / Guess Input */}
      {!isComplete && (
        <div className="w-full max-w-xl mb-6 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Type actor name to guess..."
            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#e5e5e5] placeholder-[#525252] focus:border-[#d4af37]/50 focus:outline-none transition-colors"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/[0.08] rounded-xl overflow-hidden z-10 shadow-2xl">
              {searchResults.map((actor) => {
                const alreadyGuessed = guesses.some(
                  g => g.toLowerCase() === actor.name.toLowerCase()
                )
                return (
                  <button
                    key={actor.id}
                    onClick={() => !alreadyGuessed && handleSelectActor(actor)}
                    disabled={alreadyGuessed}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      alreadyGuessed
                        ? 'opacity-50 cursor-not-allowed bg-white/[0.02]'
                        : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    {actor.profilePath && (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${actor.profilePath}`}
                        alt={actor.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/[0.1]"
                      />
                    )}
                    <span className="text-[#e5e5e5]">{actor.name}</span>
                    {alreadyGuessed && (
                      <span className="ml-auto text-xs text-[#525252]">Already guessed</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Previous Guesses */}
      {guesses.length > 0 && (
        <div className="w-full max-w-xl mb-6">
          <h3 className="text-sm text-[#737373] mb-2">Your guesses:</h3>
          <div className="flex flex-wrap gap-2">
            {guesses.map((guess, i) => {
              const isCorrect = guess.toLowerCase() === correctActor.name.toLowerCase()
              return (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    isCorrect
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.05] text-[#a3a3a3] border border-white/[0.08]'
                  }`}
                >
                  {guess}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Game Complete */}
      {isComplete && (
        <div className="w-full max-w-xl text-center">
          <div className={`p-6 rounded-2xl ${won ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/[0.02] border border-white/[0.08]'}`}>
            {won ? (
              <>
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-xl font-bold text-[#e5e5e5] mb-2">Correct!</h2>
                <p className="text-[#a3a3a3]">
                  You got it in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">😔</div>
                <h2 className="text-xl font-bold text-[#e5e5e5] mb-2">Game Over</h2>
                <p className="text-[#a3a3a3]">
                  The answer was <span className="font-bold text-[#e5e5e5]">{correctActor.name}</span>
                </p>
              </>
            )}
            {correctActor.profilePath && (
              <img
                src={`https://image.tmdb.org/t/p/w185${correctActor.profilePath}`}
                alt={correctActor.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mt-4 border-2 border-white/[0.1]"
              />
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
            <h2 className="text-xl font-semibold text-[#e5e5e5] text-center mb-1">Filmography</h2>
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
