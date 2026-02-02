import { getTodayDateString } from './grid-generator'
import type { GameType, PlayerStats } from './types'

const DAILY_STORAGE_PREFIX = 'film-game-daily-'

export function wasPlayedToday(gameType: GameType): boolean {
  const today = getTodayDateString()
  const key = `${DAILY_STORAGE_PREFIX}${gameType}-${today}`
  try {
    const data = localStorage.getItem(key)
    return data !== null
  } catch {
    return false
  }
}

export function getTodayResult(gameType: GameType): { played: boolean; won: boolean } {
  const today = getTodayDateString()
  const key = `${DAILY_STORAGE_PREFIX}${gameType}-${today}`
  try {
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data)
      return { played: true, won: parsed.won || false }
    }
  } catch {
    // ignore
  }
  return { played: false, won: false }
}

export function markGamePlayedToday(gameType: GameType, won: boolean): void {
  const today = getTodayDateString()
  const key = `${DAILY_STORAGE_PREFIX}${gameType}-${today}`
  try {
    localStorage.setItem(key, JSON.stringify({ won, date: today }))
  } catch {
    // ignore
  }
}

export function getCoStarsStats(): PlayerStats {
  try {
    const data = localStorage.getItem('immaculate-grid-stats')
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // ignore
  }
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalRarity: 0,
  }
}
