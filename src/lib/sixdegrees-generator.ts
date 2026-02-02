import { createSeededRandom, hashString } from './seeded-random'
import { getTodayDateString, getPuzzleNumber } from './grid-generator'
import type { Actor, Movie, MovieData } from './types'
import movieData from '../data/movie-data.json'

const data = movieData as MovieData

export interface SixDegreesPuzzle {
  startActor: Actor
  endActor: Actor
  date: string
  puzzleNumber: number
  optimalPath: number // Minimum steps to connect them
}

// Build connection graph for pathfinding
const connectionMap = new Map<number, Map<number, number[]>>() // actorId -> Map<connectedActorId, sharedMovieIds>

for (const actor of data.actors) {
  connectionMap.set(actor.id, new Map())
}

for (const actor1 of data.actors) {
  const movies1 = new Set(data.actorMovies[actor1.id] || [])
  for (const actor2 of data.actors) {
    if (actor1.id !== actor2.id) {
      const sharedMovies = (data.actorMovies[actor2.id] || []).filter(id => movies1.has(id))
      if (sharedMovies.length > 0) {
        connectionMap.get(actor1.id)!.set(actor2.id, sharedMovies)
      }
    }
  }
}

// BFS to find shortest path between two actors
function findShortestPath(startId: number, endId: number): number {
  if (startId === endId) return 0

  const visited = new Set<number>([startId])
  const queue: { actorId: number; depth: number }[] = [{ actorId: startId, depth: 0 }]

  while (queue.length > 0) {
    const { actorId, depth } = queue.shift()!

    const connections = connectionMap.get(actorId)
    if (!connections) continue

    for (const connectedId of connections.keys()) {
      if (connectedId === endId) {
        return depth + 1
      }
      if (!visited.has(connectedId)) {
        visited.add(connectedId)
        queue.push({ actorId: connectedId, depth: depth + 1 })
      }
    }
  }

  return -1 // Not connected
}

// Get actors with good connectivity (at least 5 connections for more variety)
const wellConnectedActors = data.actors.filter(actor => {
  const connections = connectionMap.get(actor.id)
  return connections && connections.size >= 5
})

export function generateDailySixDegrees(dateOverride?: string): SixDegreesPuzzle {
  const date = dateOverride || getTodayDateString()
  const puzzleNumber = getPuzzleNumber(date)

  const seed = hashString(`sixdegrees-${date}`)
  const random = createSeededRandom(seed)

  // Progressive difficulty: allow some variation in path length
  // But keep it reasonable (2-4 steps) for playability
  const weekNumber = Math.floor((puzzleNumber - 1) / 7)
  const minPath = 2
  const maxPath = Math.min(3 + Math.floor(weekNumber / 3), 5) // 3-5 steps max

  // Try to find a pair with the target path length
  let attempts = 0
  let startActor: Actor
  let endActor: Actor
  let pathLength: number

  do {
    const startIndex = Math.floor(random() * wellConnectedActors.length)
    const endIndex = Math.floor(random() * wellConnectedActors.length)

    startActor = wellConnectedActors[startIndex]
    endActor = wellConnectedActors[endIndex]
    pathLength = findShortestPath(startActor.id, endActor.id)

    attempts++
  } while (
    (pathLength < minPath || pathLength > maxPath || startActor.id === endActor.id) &&
    attempts < 100
  )

  // Fallback if we couldn't find ideal pair
  if (pathLength < 2 || pathLength > 5) {
    pathLength = 2
  }

  return {
    startActor,
    endActor,
    date,
    puzzleNumber,
    optimalPath: pathLength,
  }
}

export function getSharedMovies(actor1Id: number, actor2Id: number): Movie[] {
  const connections = connectionMap.get(actor1Id)
  if (!connections) return []

  const movieIds = connections.get(actor2Id) || []
  return movieIds
    .map(id => data.movies.find(m => m.id === id))
    .filter((m): m is Movie => m !== undefined)
}

export function getActorMovies(actorId: number): Movie[] {
  const movieIds = data.actorMovies[actorId] || []
  return movieIds
    .map(id => data.movies.find(m => m.id === id))
    .filter((m): m is Movie => m !== undefined)
    .sort((a, b) => b.popularity - a.popularity)
}

export function getMovieActors(movieId: number): Actor[] {
  const actorIds = data.movieActors[movieId] || []
  return actorIds
    .map(id => data.actors.find(a => a.id === id))
    .filter((a): a is Actor => a !== undefined)
}

export function searchMovies(query: string): Movie[] {
  if (!query.trim()) return []
  const lower = query.toLowerCase()
  return data.movies
    .filter(m => m.title.toLowerCase().includes(lower))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10)
}

export function searchActorsForSixDegrees(query: string): Actor[] {
  if (!query.trim()) return []
  const lower = query.toLowerCase()
  return data.actors
    .filter(a => a.name.toLowerCase().includes(lower))
    .slice(0, 10)
}

export function getAllActors(): Actor[] {
  return data.actors
}
