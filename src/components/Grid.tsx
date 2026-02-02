import { Fragment } from 'react'
import type { Actor, Movie } from '../lib/types'

interface GridProps {
  rowActors: Actor[]
  colActors: Actor[]
  grid: (Movie | null)[][]
  selectedCell: [number, number] | null
  onCellClick: (row: number, col: number) => void
  isComplete: boolean
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'

export function Grid({ rowActors, colActors, grid, selectedCell, onCellClick, isComplete }: GridProps) {
  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-2">
      {/* Header row */}
      <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32" /> {/* Empty corner */}
      {colActors.map(actor => (
        <div
          key={actor.id}
          title={actor.name}
          className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex flex-col items-center justify-center bg-white/[0.03] rounded-xl p-1 sm:p-2 cursor-help group relative border border-white/[0.05]"
        >
          {actor.profilePath && (
            <img
              src={`${TMDB_IMAGE_BASE}${actor.profilePath}`}
              alt={actor.name}
              className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover mb-1 sm:mb-2 border-2 border-white/[0.1]"
            />
          )}
          <span className="text-xs sm:text-sm text-center leading-tight font-medium truncate w-full text-[#e5e5e5]">
            {actor.name.split(' ').pop()}
          </span>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] text-[#e5e5e5] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-white/[0.1]">
            {actor.name}
          </div>
        </div>
      ))}

      {/* Grid rows */}
      {rowActors.map((rowActor, rowIdx) => (
        <Fragment key={rowActor.id}>
          {/* Row header */}
          <div
            title={rowActor.name}
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex flex-col items-center justify-center bg-white/[0.03] rounded-xl p-1 sm:p-2 cursor-help group relative border border-white/[0.05]"
          >
            {rowActor.profilePath && (
              <img
                src={`${TMDB_IMAGE_BASE}${rowActor.profilePath}`}
                alt={rowActor.name}
                className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover mb-1 sm:mb-2 border-2 border-white/[0.1]"
              />
            )}
            <span className="text-xs sm:text-sm text-center leading-tight font-medium truncate w-full text-[#e5e5e5]">
              {rowActor.name.split(' ').pop()}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] text-[#e5e5e5] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-white/[0.1]">
              {rowActor.name}
            </div>
          </div>

          {/* Grid cells */}
          {colActors.map((_, colIdx) => {
            const movie = grid[rowIdx][colIdx]
            const isSelected = selectedCell?.[0] === rowIdx && selectedCell?.[1] === colIdx
            const isFilled = movie !== null

            return (
              <button
                key={`cell-${rowIdx}-${colIdx}`}
                onClick={() => !isFilled && !isComplete && onCellClick(rowIdx, colIdx)}
                disabled={isFilled || isComplete}
                title={movie?.title}
                className={`
                  w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl flex items-center justify-center
                  transition-all duration-150 border
                  ${isFilled
                    ? 'bg-emerald-500/20 border-emerald-500/30'
                    : isSelected
                    ? 'bg-[#d4af37]/20 border-[#d4af37]/50 ring-2 sm:ring-4 ring-[#d4af37]/30 scale-105'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1]'
                  }
                  ${!isFilled && !isComplete ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {movie ? (
                  movie.posterPath ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
                      alt={movie.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm text-center p-1 sm:p-2 font-medium text-[#e5e5e5]">{movie.title}</span>
                  )
                ) : (
                  <span className="text-[#525252] text-2xl sm:text-4xl">?</span>
                )}
              </button>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
