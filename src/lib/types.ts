export interface Actor {
  id: number
  name: string
  profilePath: string | null
}

export interface Movie {
  id: number
  title: string
  popularity: number
  posterPath: string | null
  releaseYear: number
}

export interface MovieData {
  actors: Actor[]
  movies: Movie[]
  actorMovies: Record<number, number[]>
  movieActors: Record<number, number[]>
}

export interface DailyGrid {
  rowActors: Actor[]
  colActors: Actor[]
  date: string
}

export interface GameScore {
  correct: number
  rarity: number
}

export interface PlayerStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  totalRarity: number
}

export interface CellResult {
  movie: Movie | null
  correct: boolean
}

// Game types for multi-game support
export type GameType = 'costars' | 'filmography' | 'sixdegrees'

export interface GameCardData {
  id: GameType
  name: string
  description: string
  route: string
  icon: string
  playedToday: boolean
  wonToday: boolean
  currentStreak: number
  isAvailable: boolean
}
