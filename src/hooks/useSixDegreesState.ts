import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { getMovieActors } from '../lib/sixdegrees-generator'
import type { Actor, Movie } from '../lib/types'
import type { SixDegreesPuzzle } from '../lib/sixdegrees-generator'

interface PathStep {
  type: 'actor' | 'movie'
  actor?: Actor
  movie?: Movie
}

interface SixDegreesGameState {
  path: PathStep[]
  isComplete: boolean
  won: boolean
}

export function useSixDegreesState(puzzle: SixDegreesPuzzle) {
  const storageKey = `sixdegrees-state-${puzzle.date}`

  const [state, setState] = useLocalStorage<SixDegreesGameState>(storageKey, {
    path: [{ type: 'actor', actor: puzzle.startActor }],
    isComplete: false,
    won: false,
  })

  const currentStep = state.path[state.path.length - 1]
  const needsMovie = currentStep.type === 'actor'
  const currentActor = needsMovie ? currentStep.actor : undefined

  // Get the last actor in the path (for movie selection validation)
  const getLastActor = (): Actor | undefined => {
    for (let i = state.path.length - 1; i >= 0; i--) {
      if (state.path[i].type === 'actor' && state.path[i].actor) {
        return state.path[i].actor
      }
    }
    return undefined
  }

  const selectMovie = useCallback((movie: Movie) => {
    if (state.isComplete || !needsMovie || !currentActor) return

    // Verify the movie connects to the current actor
    const actorsInMovie = getMovieActors(movie.id)
    const hasCurrentActor = actorsInMovie.some(a => a.id === currentActor.id)

    if (!hasCurrentActor) return // Invalid selection

    setState(prev => ({
      ...prev,
      path: [...prev.path, { type: 'movie', movie }],
    }))
  }, [state, needsMovie, currentActor, setState])

  const selectActor = useCallback((actor: Actor) => {
    if (state.isComplete || needsMovie) return

    const lastMovie = currentStep.movie
    if (!lastMovie) return

    // Verify the actor was in the last movie
    const actorsInMovie = getMovieActors(lastMovie.id)
    const validActor = actorsInMovie.some(a => a.id === actor.id)

    if (!validActor) return // Invalid selection

    // Check if this is the target actor
    const won = actor.id === puzzle.endActor.id
    const newPath = [...state.path, { type: 'actor' as const, actor }]

    setState({
      path: newPath,
      isComplete: won,
      won,
    })
  }, [state, needsMovie, currentStep, puzzle, setState])

  const undo = useCallback(() => {
    if (state.isComplete || state.path.length <= 1) return

    setState(prev => ({
      ...prev,
      path: prev.path.slice(0, -1),
    }))
  }, [state, setState])

  const reset = useCallback(() => {
    setState({
      path: [{ type: 'actor', actor: puzzle.startActor }],
      isComplete: false,
      won: false,
    })
  }, [puzzle, setState])

  // Calculate steps taken (number of actors after start, excluding movies)
  const stepsTaken = state.path.filter(s => s.type === 'actor').length - 1

  return {
    path: state.path,
    isComplete: state.isComplete,
    won: state.won,
    needsMovie,
    currentActor: getLastActor(),
    currentMovie: !needsMovie ? currentStep.movie : undefined,
    stepsTaken,
    selectMovie,
    selectActor,
    undo,
    reset,
  }
}
