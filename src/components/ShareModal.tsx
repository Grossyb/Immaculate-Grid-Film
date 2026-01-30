import { useState } from 'react'
import type { Movie, GameScore } from '../lib/types'
import { generateShareText } from '../lib/game-logic'
import { getTodayDateString } from '../lib/grid-generator'

interface ShareModalProps {
  grid: (Movie | null)[][]
  score: GameScore
  onClose: () => void
}

export function ShareModal({ grid, score, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const shareText = generateShareText(grid, score, getTodayDateString())

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4 text-center">
          {score.correct === 9 ? '🎉 Perfect!' : 'Game Over'}
        </h2>

        <div className="text-center mb-4">
          <div className="text-4xl mb-2">
            {grid.map((row, i) => (
              <div key={i}>
                {row.map((cell, j) => (
                  <span key={j}>{cell ? '🟩' : '🟥'}</span>
                ))}
              </div>
            ))}
          </div>
          <p className="text-lg">
            Score: <span className="font-bold">{score.correct}/9</span>
          </p>
          <p className="text-gray-400">
            Rarity: <span className="font-semibold text-purple-400">{score.rarity}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-500"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
