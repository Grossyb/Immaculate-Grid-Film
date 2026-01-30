import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_KEY = 'd9dad89e15708720372c55bb540f9263'
const BASE_URL = 'https://api.themoviedb.org/3'

interface TmdbActor {
  id: number
  name: string
  profile_path: string | null
  popularity: number
}

interface TmdbMovie {
  id: number
  title: string
  popularity: number
  poster_path: string | null
  release_date: string
}

interface TmdbCredits {
  cast: TmdbMovie[]
}

interface Actor {
  id: number
  name: string
  profilePath: string | null
}

interface Movie {
  id: number
  title: string
  popularity: number
  posterPath: string | null
  releaseYear: number
}

interface MovieData {
  actors: Actor[]
  movies: Movie[]
  actorMovies: Record<number, number[]>
  movieActors: Record<number, number[]>
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchPopularActors(pages: number = 25): Promise<TmdbActor[]> {
  const actors: TmdbActor[] = []

  for (let page = 1; page <= pages; page++) {
    console.log(`Fetching actors page ${page}/${pages}...`)
    const url = `${BASE_URL}/person/popular?api_key=${API_KEY}&page=${page}`
    const data = await fetchJson<{ results: TmdbActor[] }>(url)
    actors.push(...data.results)
    await delay(100) // Rate limiting
  }

  return actors
}

async function fetchActorMovies(actorId: number): Promise<TmdbMovie[]> {
  const url = `${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`
  const data = await fetchJson<TmdbCredits>(url)
  return data.cast || []
}

async function main() {
  console.log('Starting TMDB data fetch...')

  // Fetch popular actors
  const tmdbActors = await fetchPopularActors(50) // ~1000 actors
  console.log(`Fetched ${tmdbActors.length} actors`)

  const actors: Actor[] = []
  const movies: Movie[] = []
  const movieMap = new Map<number, Movie>()
  const actorMovies: Record<number, number[]> = {}
  const movieActors: Record<number, number[]> = {}

  // Process each actor
  for (let i = 0; i < tmdbActors.length; i++) {
    const tmdbActor = tmdbActors[i]
    console.log(`Processing actor ${i + 1}/${tmdbActors.length}: ${tmdbActor.name}`)

    try {
      const actorCredits = await fetchActorMovies(tmdbActor.id)

      // Filter to movies with decent popularity
      const relevantMovies = actorCredits.filter(m =>
        m.id && m.title && m.popularity > 5
      )

      if (relevantMovies.length < 5) {
        console.log(`  Skipping - only ${relevantMovies.length} movies`)
        continue
      }

      actors.push({
        id: tmdbActor.id,
        name: tmdbActor.name,
        profilePath: tmdbActor.profile_path,
      })

      actorMovies[tmdbActor.id] = []

      for (const m of relevantMovies) {
        // Add movie if not already added
        if (!movieMap.has(m.id)) {
          const movie: Movie = {
            id: m.id,
            title: m.title,
            popularity: m.popularity,
            posterPath: m.poster_path,
            releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4)) : 0,
          }
          movieMap.set(m.id, movie)
          movies.push(movie)
          movieActors[m.id] = []
        }

        actorMovies[tmdbActor.id].push(m.id)
        movieActors[m.id].push(tmdbActor.id)
      }

      await delay(100) // Rate limiting
    } catch (err) {
      console.error(`  Error processing ${tmdbActor.name}:`, err)
    }
  }

  // Filter to actors who share movies with at least 5 other actors
  console.log('\nFiltering actors with sufficient connections...')
  const connectedActors = actors.filter(actor => {
    const sharedActorIds = new Set<number>()
    for (const movieId of actorMovies[actor.id] || []) {
      for (const otherId of movieActors[movieId] || []) {
        if (otherId !== actor.id) sharedActorIds.add(otherId)
      }
    }
    return sharedActorIds.size >= 5
  })

  console.log(`Kept ${connectedActors.length} well-connected actors`)

  // Build final data
  const connectedActorIds = new Set(connectedActors.map(a => a.id))
  const finalActorMovies: Record<number, number[]> = {}
  const finalMovieActors: Record<number, number[]> = {}
  const usedMovieIds = new Set<number>()

  for (const actor of connectedActors) {
    finalActorMovies[actor.id] = actorMovies[actor.id] || []
    for (const movieId of finalActorMovies[actor.id]) {
      usedMovieIds.add(movieId)
    }
  }

  for (const movieId of usedMovieIds) {
    finalMovieActors[movieId] = (movieActors[movieId] || [])
      .filter(id => connectedActorIds.has(id))
  }

  const finalMovies = movies.filter(m => usedMovieIds.has(m.id))

  const data: MovieData = {
    actors: connectedActors,
    movies: finalMovies,
    actorMovies: finalActorMovies,
    movieActors: finalMovieActors,
  }

  // Save to file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'movie-data.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

  console.log('\nDone!')
  console.log(`Actors: ${connectedActors.length}`)
  console.log(`Movies: ${finalMovies.length}`)
  console.log(`Saved to: ${outputPath}`)
}

main().catch(console.error)
