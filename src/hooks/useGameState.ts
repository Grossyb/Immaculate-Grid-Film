import { useState, useEffect, useCallback } from 'react'
import type { Movie, DailyGrid, GameScore } from '../lib/types'
import { getSharedMovies, getMovieById } from '../lib/grid-generator'
import { calculateRarity } from '../lib/game-logic'
import { useLocalStorage } from './useLocalStorage'

interface GameState {
  grid: (Movie | null)[][]
  usedMovies: Set<number>
  guessesRemaining: number
  isComplete: boolean
}

const INITIAL_GUESSES = 9

export function useGameState(dailyGrid: DailyGrid) {
  const storageKey = `immaculate-grid-game-${dailyGrid.date}`

  const [savedState, setSavedState] = useLocalStorage<{
    grid: (number | null)[][]
    usedMovies: number[]
    guessesRemaining: number
  } | null>(storageKey, null)

  const [state, setState] = useState<GameState>(() => {
    if (savedState) {
      return {
        grid: savedState.grid.map(row =>
          row.map(id => (id ? getMovieById(id) || null : null))
        ),
        usedMovies: new Set(savedState.usedMovies),
        guessesRemaining: savedState.guessesRemaining,
        isComplete: savedState.guessesRemaining === 0 ||
          savedState.grid.every(row => row.every(cell => cell !== null)),
      }
    }
    return {
      grid: [[null, null, null], [null, null, null], [null, null, null]],
      usedMovies: new Set(),
      guessesRemaining: INITIAL_GUESSES,
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
        isComplete: savedState.guessesRemaining === 0 ||
          savedState.grid.every(row => row.every(cell => cell !== null)),
      })
    } else {
      setState({
        grid: [[null, null, null], [null, null, null], [null, null, null]],
        usedMovies: new Set(),
        guessesRemaining: INITIAL_GUESSES,
        isComplete: false,
      })
    }
    setSelectedCell(null)
  }, [storageKey])

  // Save state changes to localStorage
  useEffect(() => {
    setSavedState({
      grid: state.grid.map(row => row.map(movie => movie?.id || null)),
      usedMovies: Array.from(state.usedMovies),
      guessesRemaining: state.guessesRemaining,
    })
  }, [state, setSavedState])

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

  return {
    grid: state.grid,
    selectedCell,
    guessesRemaining: state.guessesRemaining,
    isComplete: state.isComplete,
    score,
    selectCell,
    makeGuess,
    getValidMoviesForCell,
  }
}
