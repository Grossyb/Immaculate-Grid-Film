import { useMemo } from 'react'
import { getTodayResult, getCoStarsStats } from '../lib/stats'
import { getTodayDateString } from '../lib/grid-generator'
import type { GameType, GameCardData } from '../lib/types'

const GAME_CONFIGS: Record<GameType, { name: string; description: string; route: string; icon: string; isAvailable: boolean }> = {
  costars: {
    name: 'Co-Stars',
    description: 'Find movies connecting actors',
    route: '/costars',
    icon: '🎬',
    isAvailable: true,
  },
  filmography: {
    name: 'Filmography',
    description: 'Guess the actor from their films',
    route: '/filmography',
    icon: '🎭',
    isAvailable: true,
  },
  sixdegrees: {
    name: 'Six Degrees',
    description: 'Connect two actors via shared movies',
    route: '/sixdegrees',
    icon: '🔗',
    isAvailable: true,
  },
}

export function useGameStats() {
  const coStarsStats = getCoStarsStats()
  const today = getTodayDateString()

  const gameCards: GameCardData[] = useMemo(() => {
    return (['costars', 'filmography', 'sixdegrees'] as GameType[]).map(gameType => {
      const config = GAME_CONFIGS[gameType]

      let todayResult = { played: false, won: false }
      let currentStreak = 0

      if (gameType === 'costars') {
        // Check multiple storage patterns for Co-Stars
        try {
          // Check the tracked completion key
          const trackedKey = `costars-tracked-${today}`
          const wasTracked = localStorage.getItem(trackedKey)
          if (wasTracked) {
            todayResult = { played: true, won: JSON.parse(wasTracked) }
          }

          // Also check the game state
          const savedState = localStorage.getItem('immaculate-grid-state')
          if (savedState) {
            const parsed = JSON.parse(savedState)
            // Check if the saved state is from today
            if (parsed.date === today && parsed.isComplete) {
              todayResult = { played: true, won: parsed.score?.correct === 9 }
            }
          }
        } catch {
          // ignore
        }
        currentStreak = coStarsStats.currentStreak
      } else {
        todayResult = getTodayResult(gameType)

        // Get streak from stats
        try {
          const statsKey = gameType === 'filmography' ? 'filmography-stats' : 'sixdegrees-stats'
          const stats = localStorage.getItem(statsKey)
          if (stats) {
            const parsed = JSON.parse(stats)
            currentStreak = parsed.currentStreak || 0
          }
        } catch {
          // ignore
        }
      }

      return {
        id: gameType,
        name: config.name,
        description: config.description,
        route: config.route,
        icon: config.icon,
        playedToday: todayResult.played,
        wonToday: todayResult.won,
        currentStreak,
        isAvailable: config.isAvailable,
      }
    })
  }, [coStarsStats, today])

  const overallStats = useMemo(() => {
    return {
      totalPlayed: coStarsStats.gamesPlayed,
      totalWon: coStarsStats.gamesWon,
      longestStreak: coStarsStats.maxStreak,
    }
  }, [coStarsStats])

  return { gameCards, overallStats }
}
