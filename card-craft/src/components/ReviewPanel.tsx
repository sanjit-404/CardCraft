import { useState } from 'react'
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
    <section className="panel">
      <h3>AI design review</h3>
      <p className="hint">Reviews the last saved version of this design.</p>
      <button type="button" onClick={handleReview} disabled={status === 'loading'}>
        {status === 'loading' ? 'Reviewing…' : 'AI review'}
      </button>

      {status === 'loading' && <p className="hint">This can take up to a minute. Hang tight!</p>}
      {status === 'error' && <p className="error-text">{error}</p>}
      {status === 'done' && review && (
        <div className="review-result">
          <p className="review-score">
            Score: <strong>{review.score}</strong> / 10
          </p>
          {review.tips.length > 0 ? (
            <ul>
              {review.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p className="hint">No tips. Looks great!</p>
          )}
        </div>
      )}
    </section>
  )
}

export default ReviewPanel
