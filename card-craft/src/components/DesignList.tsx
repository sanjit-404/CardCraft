import type { CSSProperties } from 'react'
import MiniCard from './MiniCard'
import { maskCardNumber } from '../cardNumber'
import { getSavedFinish, resolveFinish } from '../finishes'
import type { Card } from '../types'

type DesignListProps = {
  cards: Card[]
  loadStatus: 'loading' | 'ready' | 'error'
  loadError: string
  openCardId: string | null // the design open in the editor, to highlight it
  busyCardId: string | null // the design being deleted or updated right now
  onRetry: () => void
  onOpen: (card: Card) => void
  onDelete: (card: Card) => void
  onToggleStatus: (card: Card) => void
  onNewDesign: () => void
}

// "2026-10-25T09:30:00Z" -> "25 Oct 2026" (in the user's own language settings)
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// Grey shimmering placeholders shown while the designs load
function GallerySkeleton() {
  return (
    <ul className="gallery" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="gallery-item">
          <div className="skeleton skeleton-card" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </li>
      ))}
    </ul>
  )
}

// "My designs" as a gallery of small card thumbnails. It only shows things;
// the parent does the API calls.
function DesignList(props: DesignListProps) {
  const { cards, loadStatus, loadError, openCardId, busyCardId } = props

  return (
    <section className="gallery-section" aria-labelledby="gallery-title">
      <div className="gallery-head">
        <div>
          <p className="eyebrow">Your collection</p>
          <h2 id="gallery-title">My designs</h2>
        </div>
        {loadStatus === 'ready' && <span className="pill">{cards.length} saved</span>}
      </div>

      {loadStatus === 'loading' && (
        <>
          <p className="sr-only">Loading your designs…</p>
          <GallerySkeleton />
        </>
      )}

      {loadStatus === 'error' && (
        <div className="glass empty-state">
          <p className="alert alert-error">Couldn't load your designs: {loadError}</p>
          <button type="button" className="btn btn-ghost" onClick={props.onRetry}>
            Try again
          </button>
        </div>
      )}

      {loadStatus === 'ready' && cards.length === 0 && (
        <div className="glass empty-state">
          <div className="empty-card" aria-hidden="true" />
          <p>No saved designs yet. Your saved cards will appear here.</p>
          <button type="button" className="btn btn-ghost" onClick={props.onNewDesign}>
            + Start a design
          </button>
        </div>
      )}

      {loadStatus === 'ready' && cards.length > 0 && (
        <ul className="gallery">
          {cards.map((card, i) => {
            const busy = busyCardId === card._id
            const isOpen = card._id === openCardId
            return (
              <li
                key={card._id}
                className={`gallery-item rise ${isOpen ? 'is-open' : ''} ${busy ? 'is-busy' : ''}`}
                style={{ '--i': Math.min(i, 8) } as CSSProperties}
              >
                <button
                  type="button"
                  className="thumb"
                  onClick={() => props.onOpen(card)}
                  disabled={busy}
                  aria-label={`Open design "${card.name}"`}
                >
                  <MiniCard
                    name={card.name}
                    numberText={maskCardNumber(card.cardLast4, card.network)}
                    network={card.network}
                    finish={resolveFinish(getSavedFinish(card._id), card.network)}
                    coBrand={card.coBrand}
                  />
                  <span className={`status-badge ${card.status}`}>{card.status === 'final' ? 'Final' : 'Draft'}</span>
                  {isOpen && <span className="open-badge">Open</span>}
                </button>

                <div className="gallery-meta">
                  <strong className="gallery-name">{card.name}</strong>
                  <span className="hint">Updated {formatDate(card.updatedAt)}</span>
                </div>

                <div className="gallery-actions">
                  <button type="button" className="btn btn-small btn-ghost" onClick={() => props.onToggleStatus(card)} disabled={busy}>
                    {card.status === 'final' ? 'Mark as draft' : 'Mark as final'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => props.onDelete(card)}
                    disabled={busy}
                    aria-label={`Delete design "${card.name}"`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default DesignList
