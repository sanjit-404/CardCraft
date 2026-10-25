import { useState, type CSSProperties } from 'react'
import { ApiError, describeError, reviewCard } from '../api'
import type { Review } from '../types'

type ReviewPanelProps = {
  cardId: string
}

// Friendly words for the two "try again later" errors
function reviewErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 503) {
    return 'The AI reviewer is unavailable right now. Please try again in a few minutes.'
  }
  if (err instanceof ApiError && err.status === 429) {
    return "You've asked for a lot of reviews. Please wait a minute and try again."
  }
  return describeError(err)
}

const RING_RADIUS = 42
const RING_LENGTH = 2 * Math.PI * RING_RADIUS // the circle's full outline length

// A circle that fills up to the score. CSS animates it from empty.
function ScoreRing({ score }: { score: number }) {
  const safeScore = Math.min(10, Math.max(0, score))
  const offset = RING_LENGTH * (1 - safeScore / 10) // how much of the outline stays empty
  let tone = 'low'
  if (safeScore >= 8) tone = 'high'
  else if (safeScore >= 5) tone = 'mid'

  return (
    <div className={`score-ring tone-${tone}`} role="img" aria-label={`Score ${safeScore} out of 10`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="score-track" cx="50" cy="50" r={RING_RADIUS} />
        <circle
          className="score-fill"
          cx="50"
          cy="50"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={offset}
          style={{ '--ring-length': RING_LENGTH } as CSSProperties}
        />
      </svg>
      <span className="score-value">
        {safeScore}
        <small>/10</small>
      </span>
    </div>
  )
}

// Sends the saved design to the AI reviewer and shows its score and tips.
function ReviewPanel({ cardId }: ReviewPanelProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [review, setReview] = useState<Review | null>(null)
  const [error, setError] = useState('')

  async function handleReview() {
    setStatus('loading')
    setError('')
    try {
      setReview(await reviewCard(cardId))
      setStatus('done')
    } catch (err) {
      setError(reviewErrorMessage(err))
      setStatus('error')
    }
  }

  return (
    <section className="glass review-panel rise">
      <div className="review-head">
        <div>
          <p className="eyebrow">AI design review</p>
          <p className="hint">Get a score and tips for the last saved version.</p>
        </div>
        <button type="button" className="btn btn-accent" onClick={handleReview} disabled={status === 'loading'}>
          {status === 'loading' ? 'Reviewing…' : status === 'done' ? 'Review again' : '✦ AI review'}
        </button>
      </div>

      {status === 'loading' && (
        <div className="review-loading" aria-live="polite">
          <div className="score-ring is-loading" aria-hidden="true" />
          <div className="review-loading-lines">
            <span className="skeleton-line" />
            <span className="skeleton-line short" />
            <p className="hint">Analysing your design… this can take up to a minute.</p>
          </div>
        </div>
      )}

      {status === 'error' && <p className="alert alert-error">{error}</p>}

      {status === 'done' && review && (
        <div className="review-result">
          <ScoreRing score={review.score} />
          {review.tips.length > 0 ? (
            <ul className="tips">
              {review.tips.map((tip, i) => (
                <li key={i} className="tip rise" style={{ '--i': i } as CSSProperties}>
                  <span className="tip-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  <p>{tip}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">No tips. This design is looking great!</p>
          )}
        </div>
      )}
    </section>
  )
}

export default ReviewPanel
