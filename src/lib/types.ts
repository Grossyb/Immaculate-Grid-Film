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
