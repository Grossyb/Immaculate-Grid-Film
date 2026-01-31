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
      <p className="text-sm text-gray-400 mb-2 text-center">
        Name a movie with <span className="text-white font-semibold">{rowActor.name}</span> and{' '}
        <span className="text-white font-semibold">{colActor.name}</span>
      </p>

      {/* Hint Display */}
      {cellHint && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-yellow-600">
          <div className="text-yellow-400 text-sm font-semibold mb-1">Hints:</div>
          <div className="space-y-1 text-sm">
            {cellHint.level >= 1 && (
              <p className="text-gray-300">
                <span className="text-yellow-500">Year:</span> {cellHint.year}
              </p>
            )}
            {cellHint.level >= 2 && (
              <p className="text-gray-300">
                <span className="text-yellow-500">Also stars:</span> {cellHint.actorName}
              </p>
            )}
            {cellHint.level >= 3 && (
              <p className="text-gray-300 font-mono tracking-wider">
                <span className="text-yellow-500">Title:</span> {cellHint.hangman}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hint Button */}
      {hintsRemaining > 0 && (
        <button
          onClick={onUseHint}
          className="w-full mb-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-500
                     rounded-lg font-medium text-black transition-colors"
        >
          Use Hint ({hintsRemaining} remaining)
        </button>
      )}

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type a movie name..."
        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg
                   focus:outline-none focus:border-blue-500 text-white text-lg"
        autoFocus
      />

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="mt-2 text-gray-500 text-center text-sm">Type at least 2 characters to search</p>
      )}

      {searchResults.length > 0 && (
        <div className="mt-2 max-h-72 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
          {searchResults.map(movie => (
            <button
              key={movie.id}
              onClick={() => onSelect(movie)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700
                         transition-colors border-b border-gray-700 last:border-b-0 text-left"
            >
              {movie.posterPath ? (
                <img
                  src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-16 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-xs">N/A</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{movie.title}</p>
                <p className="text-sm text-gray-400">{movie.releaseYear || 'Unknown year'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && searchResults.length === 0 && (
        <p className="mt-2 text-gray-500 text-center">No movies found</p>
      )}
    </div>
  )
}
