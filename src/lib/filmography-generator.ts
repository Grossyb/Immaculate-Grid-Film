import { createSeededRandom, hashString } from './seeded-random'
import { getTodayDateString, getPuzzleNumber } from './grid-generator'
import type { Actor, Movie, MovieData } from './types'
import movieData from '../data/movie-data.json'

const data = movieData as MovieData

export interface FilmographyPuzzle {
  actor: Actor
  movies: Movie[]
  date: string
  puzzleNumber: number
}

// Get actors with enough movies to make an interesting puzzle (at least 5 movies)
const eligibleActors = data.actors.filter(actor => {
  const movieIds = data.actorMovies[actor.id] || []
  return movieIds.length >= 5
})

export function generateDailyFilmography(dateOverride?: string): FilmographyPuzzle {
  const date = dateOverride || getTodayDateString()
  const puzzleNumber = getPuzzleNumber(date)

  // Use different seed prefix than Co-Stars to get different actors
  const seed = hashString(`filmography-${date}`)
  const random = createSeededRandom(seed)

  // Progressive difficulty: start with more famous actors, but use larger pool for variety
  // All eligible actors are sorted by popularity in the data
  const weekNumber = Math.floor((puzzleNumber - 1) / 7)
  const poolSize = Math.min(eligibleActors.length, 100 + weekNumber * 30)
  const actorPool = eligibleActors.slice(0, poolSize)

  // Pick random actor from pool
  const actorIndex = Math.floor(random() * actorPool.length)
  const actor = actorPool[actorIndex]

  // Get their movies sorted by year (most recent first)
  const movieIds = data.actorMovies[actor.id] || []
  const movies = movieIds
    .map(id => data.movies.find(m => m.id === id))
    .filter((m): m is Movie => m !== undefined)
    .sort((a, b) => b.releaseYear - a.releaseYear)
    .slice(0, 10) // Show top 10 movies max

  return {
    actor,
    movies,
    date,
    puzzleNumber,
  }
}

export function getAllActors(): Actor[] {
  return data.actors
}

export function searchActors(query: string): Actor[] {
  if (!query.trim()) return []
  const lower = query.toLowerCase()
  return data.actors
    .filter(a => a.name.toLowerCase().includes(lower))
    .slice(0, 10)
}
