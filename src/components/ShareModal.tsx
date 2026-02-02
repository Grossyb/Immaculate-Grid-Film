import { useState } from 'react'
import { track } from '@vercel/analytics'
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
    track('share_clicked', { score: score.correct, rarity: score.rarity })
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
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] rounded-xl p-6 max-w-sm w-full border border-white/[0.08]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[#e5e5e5] text-center mb-1">
          {score.correct === 9 ? '🎉 Perfect!' : 'Game Over'}
        </h2>
        <p className="text-xs text-[#525252] text-center mb-6 uppercase tracking-wider">Results</p>

        <div className="text-center mb-6">
          <div className="text-4xl mb-4 leading-tight">
            {grid.map((row, i) => (
              <div key={i}>
                {row.map((cell, j) => (
                  <span key={j}>{cell ? '🟩' : '🟥'}</span>
                ))}
              </div>
            ))}
          </div>
          <p className="text-lg text-[#e5e5e5]">
            Score: <span className="font-bold">{score.correct}/9</span>
          </p>
          <p className="text-[#737373]">
            Rarity: <span className="font-semibold text-[#d4af37]">{score.rarity}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-[#d4af37] text-black rounded-lg font-semibold hover:bg-[#e5c349] transition-colors"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg font-semibold text-[#e5e5e5] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
