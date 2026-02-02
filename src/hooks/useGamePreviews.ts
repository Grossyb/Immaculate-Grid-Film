import { useMemo } from 'react'
import { generateDailyGrid } from '../lib/grid-generator'
import { generateDailyFilmography } from '../lib/filmography-generator'
import { generateDailySixDegrees } from '../lib/sixdegrees-generator'

export interface GamePreview {
  costars: {
    actors: string[] // profile image URLs
  }
  filmography: {
    movies: string[] // poster URLs
  }
  sixdegrees: {
    startActor: string | null
    endActor: string | null
  }
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'

export function useGamePreviews(): GamePreview {
  return useMemo(() => {
    // Co-Stars: Get actors from today's grid
    const coStarsGrid = generateDailyGrid()
    const coStarsActors = [
      ...coStarsGrid.rowActors,
      ...coStarsGrid.colActors,
    ]
      .filter(a => a.profilePath)
      .slice(0, 6)
      .map(a => `${TMDB_IMAGE_BASE}${a.profilePath}`)

    // Filmography: Get movie posters from today's actor
    const filmographyPuzzle = generateDailyFilmography()
    const filmographyMovies = filmographyPuzzle.movies
      .filter(m => m.posterPath)
      .slice(0, 4)
      .map(m => `${TMDB_IMAGE_BASE}${m.posterPath}`)

    // Six Degrees: Get the two target actors
    const sixDegreesPuzzle = generateDailySixDegrees()

    return {
      costars: {
        actors: coStarsActors,
      },
      filmography: {
        movies: filmographyMovies,
      },
      sixdegrees: {
        startActor: sixDegreesPuzzle.startActor.profilePath
          ? `${TMDB_IMAGE_BASE}${sixDegreesPuzzle.startActor.profilePath}`
          : null,
        endActor: sixDegreesPuzzle.endActor.profilePath
          ? `${TMDB_IMAGE_BASE}${sixDegreesPuzzle.endActor.profilePath}`
          : null,
      },
    }
  }, [])
}
