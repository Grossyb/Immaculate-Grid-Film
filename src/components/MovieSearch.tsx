import { useState, useMemo } from 'react'
import type { Actor, Movie } from '../lib/types'
import type { CellHint } from '../hooks/useGameState'
import { movieData } from '../lib/grid-generator'

interface MovieSearchProps {
  onSelect: (movie: Movie) => void
  rowActor: Actor
  colActor: Actor
  onUseHint: () => void
  cellHint: CellHint | null
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92'

export function MovieSearch({ onSelect, rowActor, colActor, onUseHint, cellHint }: MovieSearchProps) {
  const [query, setQuery] = useState('')

  // Search ALL movies based on user input
  const searchResults = useMemo(() => {
    if (query.trim().length < 2) return []

    const lower = query.toLowerCase()
    return movieData.movies
      .filter(m => m.title.toLowerCase().includes(lower))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 8)
  }, [query])

  const hintsUsed = cellHint?.level || 0
  const hintsRemaining = 3 - hintsUsed

  return (
    <div className="mt-6 w-full max-w-md">
      <p className="text-sm text-[#737373] mb-2 text-center">
        Name a movie with <span className="text-[#e5e5e5] font-semibold">{rowActor.name}</span> and{' '}
        <span className="text-[#e5e5e5] font-semibold">{colActor.name}</span>
      </p>

      {/* Hint Button */}
      {hintsRemaining > 0 && (
        <button
          onClick={onUseHint}
          className="flex items-center justify-center gap-2 w-full mb-3 px-4 py-2.5
                     bg-[#d4af37] hover:bg-[#e5c349]
                     rounded-lg font-semibold text-black transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
          </svg>
          Hint ({hintsRemaining}/3)
        </button>
      )}

      {/* Hint Display */}
      {cellHint && (
        <div className="mb-3 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#d4af37]/10 border-b border-[#d4af37]/20">
            <svg className="w-4 h-4 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
            </svg>
            <span className="text-[#d4af37] text-sm font-medium">Clues Revealed</span>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {cellHint.level >= 1 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#525252] w-16">Year</span>
                <span className="text-[#e5e5e5] font-medium">{cellHint.year}</span>
              </div>
            )}
            {cellHint.level >= 2 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#525252] w-16">Co-star</span>
                <span className="text-[#e5e5e5] font-medium">{cellHint.actorName}</span>
              </div>
            )}
            {cellHint.level >= 3 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#525252] w-16">Title</span>
                <span className="text-[#d4af37] font-mono font-medium tracking-wide">{cellHint.hangman}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type a movie name..."
        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl
                   focus:outline-none focus:border-[#d4af37]/50 text-[#e5e5e5] text-lg placeholder-[#525252] transition-colors"
        autoFocus
      />

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="mt-2 text-[#525252] text-center text-sm">Type at least 2 characters to search</p>
      )}

      {searchResults.length > 0 && (
        <div className="mt-2 max-h-72 overflow-y-auto bg-[#141414] rounded-xl border border-white/[0.08]">
          {searchResults.map(movie => (
            <button
              key={movie.id}
              onClick={() => onSelect(movie)}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.05]
                         transition-colors border-b border-white/[0.05] last:border-b-0 text-left"
            >
              {movie.posterPath ? (
                <img
                  src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-16 bg-white/[0.05] rounded-lg flex items-center justify-center">
                  <span className="text-xs text-[#525252]">N/A</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-[#e5e5e5]">{movie.title}</p>
                <p className="text-sm text-[#737373]">{movie.releaseYear || 'Unknown year'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && searchResults.length === 0 && (
        <p className="mt-2 text-[#525252] text-center">No movies found</p>
      )}
    </div>
  )
}
