import { createSeededRandom, hashString, shuffleArray } from './seeded-random'
import type { Actor, DailyGrid, MovieData } from './types'
import movieData from '../data/movie-data.json'

const data = movieData as MovieData

// Build connection graph once at startup
const connectionMap = new Map<number, Set<number>>()
for (const actor of data.actors) {
  connectionMap.set(actor.id, new Set())
}
for (const actor1 of data.actors) {
  for (const actor2 of data.actors) {
    if (actor1.id !== actor2.id) {
      const movies1 = new Set(data.actorMovies[actor1.id] || [])
      const shared = (data.actorMovies[actor2.id] || []).filter(id => movies1.has(id))
      if (shared.length > 0) {
        connectionMap.get(actor1.id)!.add(actor2.id)
      }
    }
  }
}

export function getTodayDateString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function getSharedMovies(actor1Id: number, actor2Id: number): number[] {
  const movies1 = new Set(data.actorMovies[actor1Id] || [])
  const movies2 = data.actorMovies[actor2Id] || []
  return movies2.filter(id => movies1.has(id))
}

function areConnected(actor1Id: number, actor2Id: number): boolean {
  return connectionMap.get(actor1Id)?.has(actor2Id) ?? false
}

// Check if all row actors share at least one movie with all col actors
export function isValidGrid(rowActors: Actor[], colActors: Actor[]): boolean {
  for (const rowActor of rowActors) {
    for (const colActor of colActors) {
      if (!areConnected(rowActor.id, colActor.id)) {
        return false
      }
    }
  }
  return true
}

export function generateDailyGrid(dateOverride?: string): DailyGrid {
  const date = dateOverride || getTodayDateString()
  const seed = hashString(date)
  const random = createSeededRandom(seed)

  // Shuffle ALL actors for variety (not just most connected)
  const shuffled = shuffleArray([...data.actors], random)

  // Try many random combinations
  for (let attempt = 0; attempt < 2000; attempt++) {
    // Pick 6 random actors
    const indices: number[] = []
    while (indices.length < 6) {
      const idx = Math.floor(random() * shuffled.length)
      if (!indices.includes(idx)) {
        indices.push(idx)
      }
    }
    const selected = indices.map(i => shuffled[i])

    // Try different ways to split into rows and columns
    const rowActors = selected.slice(0, 3)
    const colActors = selected.slice(3, 6)

    if (isValidGrid(rowActors, colActors)) {
      return { rowActors, colActors, date }
    }

    // Also try the reverse split
    if (isValidGrid(colActors, rowActors)) {
      return { rowActors: colActors, colActors: rowActors, date }
    }
  }

  // Fallback: find ANY valid combination by brute force
  // Pick actors with at least some connections
  const connectedActors = data.actors.filter(a => (connectionMap.get(a.id)?.size ?? 0) >= 3)
  const fallbackShuffled = shuffleArray(connectedActors, random)

  for (let i = 0; i < Math.min(fallbackShuffled.length, 30); i++) {
    for (let j = i + 1; j < Math.min(fallbackShuffled.length, 30); j++) {
      for (let k = j + 1; k < Math.min(fallbackShuffled.length, 30); k++) {
        const rowActors = [fallbackShuffled[i], fallbackShuffled[j], fallbackShuffled[k]]

        for (let a = 0; a < Math.min(fallbackShuffled.length, 30); a++) {
          if (a === i || a === j || a === k) continue
          for (let b = a + 1; b < Math.min(fallbackShuffled.length, 30); b++) {
            if (b === i || b === j || b === k) continue
            for (let c = b + 1; c < Math.min(fallbackShuffled.length, 30); c++) {
              if (c === i || c === j || c === k) continue
              const colActors = [fallbackShuffled[a], fallbackShuffled[b], fallbackShuffled[c]]

              if (isValidGrid(rowActors, colActors)) {
                return { rowActors, colActors, date }
              }
            }
          }
        }
      }
    }
  }

  // Last resort
  return {
    rowActors: data.actors.slice(0, 3),
    colActors: data.actors.slice(3, 6),
    date,
  }
}

export function getMovieById(id: number) {
  return data.movies.find(m => m.id === id)
}

export function getActorById(id: number) {
  return data.actors.find(a => a.id === id)
}

export { data as movieData }
