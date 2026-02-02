import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Actor } from '../lib/types'
import type { FilmographyPuzzle } from '../lib/filmography-generator'

interface FilmographyGameState {
  guesses: string[] // Actor names guessed
  revealedMovies: number // How many movie titles are revealed (as hints)
  isComplete: boolean
  won: boolean
}

const MAX_GUESSES = 8

export function useFilmographyState(puzzle: FilmographyPuzzle) {
  const storageKey = `filmography-state-${puzzle.date}`

  const [state, setState] = useLocalStorage<FilmographyGameState>(storageKey, {
    guesses: [],
    revealedMovies: 0,
    isComplete: false,
    won: false,
  })

  const guessesRemaining = MAX_GUESSES - state.guesses.length

  const makeGuess = useCallback((actor: Actor) => {
    if (state.isComplete) return

    const alreadyGuessed = state.guesses.some(
      g => g.toLowerCase() === actor.name.toLowerCase()
    )
    if (alreadyGuessed) return

    const isCorrect = actor.id === puzzle.actor.id
    const newGuesses = [...state.guesses, actor.name]
    const isComplete = isCorrect || newGuesses.length >= MAX_GUESSES

    // Reveal a movie title as a hint after each wrong guess
    const revealedMovies = isCorrect
      ? state.revealedMovies
      : Math.min(state.revealedMovies + 1, puzzle.movies.length)

    setState({
      guesses: newGuesses,
      revealedMovies,
      isComplete,
      won: isCorrect,
    })
  }, [state, puzzle, setState])

  const revealHint = useCallback(() => {
    if (state.isComplete) return
    if (state.revealedMovies >= puzzle.movies.length) return

    setState(prev => ({
      ...prev,
      revealedMovies: prev.revealedMovies + 1,
    }))
  }, [state, puzzle, setState])

  return {
    guesses: state.guesses,
    revealedMovies: state.revealedMovies,
    isComplete: state.isComplete,
    won: state.won,
    guessesRemaining,
    makeGuess,
    revealHint,
    correctActor: puzzle.actor,
  }
}
