import { useState, useEffect, useCallback } from 'react'
import type { Movie, DailyGrid, GameScore } from '../lib/types'
import { getSharedMovies, getMovieById, movieData } from '../lib/grid-generator'
import { calculateRarity } from '../lib/game-logic'
import { useLocalStorage } from './useLocalStorage'

export interface CellHint {
  movieId: number
  level: number // 1 = year, 2 = year + actor, 3 = year + actor + hangman
  year: number
  actorName: string
  hangman: string
}

interface GameState {
  grid: (Movie | null)[][]
  usedMovies: Set<number>
  guessesRemaining: number
  cellHints: Record<string, CellHint>
  isComplete: boolean
}

const INITIAL_GUESSES = 9

function generateHangmanHint(title: string): string {
  return title
    .split(' ')
    .map(word => {
      if (word.length === 0) return ''
      return word[0] + '_'.repeat(word.length - 1)
    })
    .join(' ')
}

function getActorName(actorId: number): string {
  const actor = movieData.actors.find(a => a.id === actorId)
  return actor?.name || 'Unknown'
}

export function useGameState(dailyGrid: DailyGrid) {
  const storageKey = `immaculate-grid-game-${dailyGrid.date}`

  const [savedState, setSavedState] = useLocalStorage<{
    grid: (number | null)[][]
    usedMovies: number[]
    guessesRemaining: number
    cellHints?: Record<string, CellHint>
  } | null>(storageKey, null)

  const [state, setState] = useState<GameState>(() => {
    if (savedState) {
      return {
        grid: savedState.grid.map(row =>
          row.map(id => (id ? getMovieById(id) || null : null))
        ),
        usedMovies: new Set(savedState.usedMovies),
        guessesRemaining: savedState.guessesRemaining,
        cellHints: savedState.cellHints || {},
        isComplete: savedState.guessesRemaining === 0 ||
          savedState.grid.every(row => row.every(cell => cell !== null)),
      }
    }
    return {
      grid: [[null, null, null], [null, null, null], [null, null, null]],
      usedMovies: new Set(),
      guessesRemaining: INITIAL_GUESSES,
      cellHints: {},
      isComplete: false,
    }
  })

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)

  // Reset state when savedState changes (e.g., new day started)
  useEffect(() => {
    if (savedState) {
      setState({
        grid: savedState.grid.map(row =>
          row.map(id => (id ? getMovieById(id) || null : null))
        ),
        usedMovies: new Set(savedState.usedMovies),
        guessesRemaining: savedState.guessesRemaining,
        cellHints: savedState.cellHints || {},
        isComplete: savedState.guessesRemaining === 0 ||
          savedState.grid.every(row => row.every(cell => cell !== null)),
      })
    } else {
      setState({
        grid: [[null, null, null], [null, null, null], [null, null, null]],
        usedMovies: new Set(),
        guessesRemaining: INITIAL_GUESSES,
        cellHints: {},
        isComplete: false,
      })
    }
    setSelectedCell(null)
  }, [storageKey])

  // Save state changes to localStorage
  useEffect(() => {
    const savedData = {
      grid: state.grid.map(row => row.map(movie => movie?.id || null)),
      usedMovies: Array.from(state.usedMovies),
      guessesRemaining: state.guessesRemaining,
      cellHints: state.cellHints,
    }
    setSavedState(savedData)

    // Also save to a generic key with date for tracking on home page
    try {
      localStorage.setItem('immaculate-grid-state', JSON.stringify({
        ...savedData,
        date: dailyGrid.date,
        isComplete: state.isComplete,
        score: {
          correct: state.grid.flat().filter(Boolean).length,
        },
      }))
    } catch {
      // ignore
    }
  }, [state, setSavedState, dailyGrid.date])

  const selectCell = useCallback((row: number, col: number) => {
    if (state.isComplete || state.grid[row][col] !== null) return
    setSelectedCell([row, col])
  }, [state.isComplete, state.grid])

  const getValidMoviesForCell = useCallback((row: number, col: number): Movie[] => {
    const rowActor = dailyGrid.rowActors[row]
    const colActor = dailyGrid.colActors[col]
    const sharedMovieIds = getSharedMovies(rowActor.id, colActor.id)

    return sharedMovieIds
      .map(id => getMovieById(id))
      .filter((m): m is Movie => m !== undefined && !state.usedMovies.has(m.id))
      .sort((a, b) => b.popularity - a.popularity)
  }, [dailyGrid, state.usedMovies])

  const useHint = useCallback(() => {
    if (!selectedCell || state.isComplete) return

    const [row, col] = selectedCell
    const cellKey = `${row}-${col}`
    const existingHint = state.cellHints[cellKey]

    // Already at max hints (level 3)
    if (existingHint && existingHint.level >= 3) return

    const rowActor = dailyGrid.rowActors[row]
    const colActor = dailyGrid.colActors[col]

    // Get valid movies for this cell
    const validMovieIds = getSharedMovies(rowActor.id, colActor.id)
      .filter(id => !state.usedMovies.has(id))

    if (validMovieIds.length === 0) return

    // Use the existing hint's movie or pick the first valid one
    const movieId = existingHint?.movieId || validMovieIds[0]
    const movie = getMovieById(movieId)
    if (!movie) return

    // Find another actor from this movie (not the row or col actor)
    const movieActorIds = movieData.movieActors[movieId] || []
    const otherActorId = movieActorIds.find(
      id => id !== rowActor.id && id !== colActor.id
    )
    const otherActorName = otherActorId ? getActorName(otherActorId) : 'Another actor'

    const newLevel = existingHint ? existingHint.level + 1 : 1

    setState(prev => ({
      ...prev,
      cellHints: {
        ...prev.cellHints,
        [cellKey]: {
          movieId,
          level: newLevel,
          year: movie.releaseYear,
          actorName: otherActorName,
          hangman: generateHangmanHint(movie.title),
        },
      },
    }))
  }, [selectedCell, dailyGrid, state.isComplete, state.cellHints, state.usedMovies])

  const makeGuess = useCallback((movie: Movie) => {
    if (!selectedCell || state.isComplete) return

    const [row, col] = selectedCell
    const rowActor = dailyGrid.rowActors[row]
    const colActor = dailyGrid.colActors[col]
    const validMovies = getSharedMovies(rowActor.id, colActor.id)

    const isCorrect = validMovies.includes(movie.id) && !state.usedMovies.has(movie.id)

    setState(prev => {
      const newGrid = prev.grid.map(r => [...r])
      const newUsedMovies = new Set(prev.usedMovies)
      let newGuesses = prev.guessesRemaining

      if (isCorrect) {
        newGrid[row][col] = movie
        newUsedMovies.add(movie.id)
      } else {
        newGuesses--
      }

      const allFilled = newGrid.every(r => r.every(cell => cell !== null))
      const noGuesses = newGuesses === 0

      return {
        ...prev,
        grid: newGrid,
        usedMovies: newUsedMovies,
        guessesRemaining: newGuesses,
        isComplete: allFilled || noGuesses,
      }
    })

    setSelectedCell(null)
  }, [selectedCell, dailyGrid, state])

  const score: GameScore = {
    correct: state.grid.flat().filter(Boolean).length,
    rarity: state.grid
      .flat()
      .filter((m): m is Movie => m !== null)
      .reduce((sum, m) => sum + calculateRarity(m.popularity), 0),
  }

  // Get current cell hint
  const currentCellHint = selectedCell
    ? state.cellHints[`${selectedCell[0]}-${selectedCell[1]}`] || null
    : null

  return {
    grid: state.grid,
    selectedCell,
    guessesRemaining: state.guessesRemaining,
    isComplete: state.isComplete,
    score,
    selectCell,
    makeGuess,
    getValidMoviesForCell,
    useHint,
    currentCellHint,
  }
}
