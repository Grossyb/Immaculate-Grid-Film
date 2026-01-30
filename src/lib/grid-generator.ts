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

// Sort actors by number of connections (most connected first)
const actorsByConnections = [...data.actors].sort((a, b) => {
  const aConns = connectionMap.get(a.id)?.size ?? 0
  const bConns = connectionMap.get(b.id)?.size ?? 0
  return bConns - aConns
})

// MCU movie IDs - used to limit MCU-heavy grids
const MCU_MOVIE_IDS = new Set([
  10138,  // Iron Man
  1726,   // Iron Man 2
  68721,  // Iron Man 3
  10195,  // Thor
  76338,  // Thor: The Dark World
  284053, // Thor: Ragnarok
  616037, // Thor: Love and Thunder
  1771,   // Captain America: The First Avenger
  100402, // Captain America: The Winter Soldier
  271110, // Captain America: Civil War
  24428,  // The Avengers
  99861,  // Avengers: Age of Ultron
  299536, // Avengers: Infinity War
  299534, // Avengers: Endgame
  118340, // Guardians of the Galaxy
  283995, // Guardians of the Galaxy Vol. 2
  447365, // Guardians of the Galaxy Vol. 3
  299537, // Captain Marvel
  505642, // Black Panther
  284054, // Black Panther: Wakanda Forever
  429617, // Spider-Man: Homecoming
  315635, // Spider-Man: Homecoming (alt)
  634649, // Spider-Man: No Way Home
  497698, // Black Widow
  566525, // Shang-Chi
  524434, // Eternals
  453395, // Doctor Strange
  284052, // Doctor Strange in the Multiverse of Madness
  533535, // Deadpool & Wolverine
])

// Check how many MCU movies an actor has been in
function getMcuMovieCount(actorId: number): number {
  const actorMovies = data.actorMovies[actorId] || []
  return actorMovies.filter(id => MCU_MOVIE_IDS.has(id)).length
}

// Actor is "MCU-heavy" if they're in 3+ MCU movies
function isMcuHeavy(actor: Actor): boolean {
  return getMcuMovieCount(actor.id) >= 3
}

// Count MCU-heavy actors in a list
function countMcuHeavyActors(actors: Actor[]): number {
  return actors.filter(isMcuHeavy).length
}

const MAX_MCU_ACTORS_PER_GRID = 2

export function getTodayDateString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

// Launch date - puzzle #1 starts here (year, month-1, day)
const LAUNCH_YEAR = 2026
const LAUNCH_MONTH = 1  // January (1-indexed for clarity)
const LAUNCH_DAY = 29

export function getPuzzleNumber(dateString?: string): number {
  let year: number, month: number, day: number

  if (dateString) {
    const [y, m, d] = dateString.split('-').map(Number)
    year = y
    month = m
    day = d
  } else {
    const now = new Date()
    year = now.getFullYear()
    month = now.getMonth() + 1
    day = now.getDate()
  }

  // Calculate days since launch using local dates only
  const launchDate = new Date(LAUNCH_YEAR, LAUNCH_MONTH - 1, LAUNCH_DAY)
  const currentDate = new Date(year, month - 1, day)
  const diffTime = currentDate.getTime() - launchDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(1, diffDays + 1)
}

// Progressive difficulty: start with most connected actors, expand pool over time
function getActorPoolSize(puzzleNumber: number): number {
  if (puzzleNumber <= 7) return 30      // Week 1: easiest
  if (puzzleNumber <= 14) return 60     // Week 2
  if (puzzleNumber <= 30) return 100    // Month 1
  if (puzzleNumber <= 60) return 150    // Month 2
  return data.actors.length             // After 2 months: full pool
}

export function getSharedMovies(actor1Id: number, actor2Id: number): number[] {
  const movies1 = new Set(data.actorMovies[actor1Id] || [])
  const movies2 = data.actorMovies[actor2Id] || []
  return movies2.filter(id => movies1.has(id))
}

function areConnected(actor1Id: number, actor2Id: number): boolean {
  return connectionMap.get(actor1Id)?.has(actor2Id) ?? false
}

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

// Find actors that are connected to ALL actors in a given list
function findConnectedToAll(actors: Actor[], candidates: Actor[]): Actor[] {
  return candidates.filter(candidate => {
    if (actors.some(a => a.id === candidate.id)) return false
    return actors.every(a => areConnected(candidate.id, a.id))
  })
}

export function generateDailyGrid(dateOverride?: string): DailyGrid {
  const date = dateOverride || getTodayDateString()
  const puzzleNum = getPuzzleNumber(date)
  const seed = hashString(date)
  const random = createSeededRandom(seed)

  // Progressive difficulty: use more actors as puzzles progress
  const poolSize = getActorPoolSize(puzzleNum)
  const actorPool = actorsByConnections.slice(0, poolSize)
  const shuffled = shuffleArray([...actorPool], random)

  // Strategy: Build the grid incrementally
  // 1. Pick first row actor
  // 2. Find actors connected to first row actor, pick 2 more for columns
  // 3. Find actors connected to ALL column actors for remaining rows

  for (let attempt = 0; attempt < 500; attempt++) {
    // Reshuffle periodically for variety
    if (attempt > 0 && attempt % 50 === 0) {
      shuffleArray(shuffled, random)
    }

    // Pick a random starting actor for row 1
    const startIdx = Math.floor(random() * shuffled.length)
    const rowActor1 = shuffled[startIdx]

    // Find actors connected to rowActor1 for columns
    const connectedToRow1 = shuffled.filter(a =>
      a.id !== rowActor1.id && areConnected(rowActor1.id, a.id)
    )

    if (connectedToRow1.length < 3) continue

    // Pick 3 column actors from those connected to row1
    const colCandidates = shuffleArray([...connectedToRow1], random).slice(0, 3)
    if (colCandidates.length < 3) continue

    const colActors = colCandidates

    // Now find 2 more row actors that connect to ALL 3 column actors
    const rowCandidates = findConnectedToAll(colActors, shuffled)
      .filter(a => a.id !== rowActor1.id)

    if (rowCandidates.length < 2) continue

    const otherRows = shuffleArray([...rowCandidates], random).slice(0, 2)
    const rowActors = [rowActor1, ...otherRows]

    if (isValidGrid(rowActors, colActors)) {
      // Limit MCU-heavy actors to keep puzzles varied
      const allActors = [...rowActors, ...colActors]
      if (countMcuHeavyActors(allActors) <= MAX_MCU_ACTORS_PER_GRID) {
        return { rowActors, colActors, date }
      }
    }
  }

  // Fallback: Use known-good highly connected actors
  // These are guaranteed to have many shared movies
  const fallbackNames = [
    ['Matt Damon', 'Brad Pitt', 'Robert Downey Jr.'],
    ['Samuel L. Jackson', 'Chris Evans', 'Scarlett Johansson']
  ]

  const fallbackRows = fallbackNames[0]
    .map(name => data.actors.find(a => a.name === name))
    .filter((a): a is Actor => a !== undefined)

  const fallbackCols = fallbackNames[1]
    .map(name => data.actors.find(a => a.name === name))
    .filter((a): a is Actor => a !== undefined)

  if (fallbackRows.length === 3 && fallbackCols.length === 3 && isValidGrid(fallbackRows, fallbackCols)) {
    // Shuffle the fallback based on date for some variety
    const shuffledRows = shuffleArray([...fallbackRows], random)
    const shuffledCols = shuffleArray([...fallbackCols], random)
    return { rowActors: shuffledRows, colActors: shuffledCols, date }
  }

  // Last resort: brute force search through most connected actors
  const topActors = actorsByConnections.slice(0, 30)
  for (let i = 0; i < topActors.length; i++) {
    for (let j = i + 1; j < topActors.length; j++) {
      for (let k = j + 1; k < topActors.length; k++) {
        const rows = [topActors[i], topActors[j], topActors[k]]
        for (let a = 0; a < topActors.length; a++) {
          if (a === i || a === j || a === k) continue
          for (let b = a + 1; b < topActors.length; b++) {
            if (b === i || b === j || b === k) continue
            for (let c = b + 1; c < topActors.length; c++) {
              if (c === i || c === j || c === k) continue
              const cols = [topActors[a], topActors[b], topActors[c]]
              if (isValidGrid(rows, cols)) {
                return { rowActors: rows, colActors: cols, date }
              }
            }
          }
        }
      }
    }
  }

  // This should never happen with good data
  console.error('Could not generate valid grid!')
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
