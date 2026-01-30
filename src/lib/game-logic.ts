import type { Movie } from './types'

export function calculateRarity(popularity: number): number {
  // Lower popularity = higher rarity score
  // Popularity ranges from ~0 to ~100+ for blockbusters
  // We want obscure films (low popularity) to give high scores
  if (popularity <= 0) return 100
  const rarity = Math.max(0, Math.min(100, 100 - Math.log10(popularity + 1) * 40))
  return Math.round(rarity)
}

export function generateShareText(
  grid: (Movie | null)[][],
  score: { correct: number; rarity: number },
  date: string
): string {
  const emojiGrid = grid
    .map(row =>
      row.map(cell => (cell ? '🟩' : '🟥')).join('')
    )
    .join('\n')

  return `Immaculate Grid - Movies 🎬
${date}

${emojiGrid}

Score: ${score.correct}/9
Rarity: ${score.rarity}

Play at: [your-url-here]`
}
