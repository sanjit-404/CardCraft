import { NETWORK_NAMES } from '../cardNumber'
import type { Card } from '../types'

type DesignListProps = {
  cards: Card[]
  loadStatus: 'loading' | 'ready' | 'error'
  loadError: string
  actionError: string // a failed delete or status change
  openCardId: string | null // the design open in the editor, to highlight it
  busyCardId: string | null // the design being deleted or updated right now
  onRetry: () => void
  onOpen: (card: Card) => void
  onDelete: (card: Card) => void
  onToggleStatus: (card: Card) => void
}

// "2026-10-25T09:30:00Z" -> "25 Oct 2026" (in the user's own language settings)
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// The "My designs" list. It only shows things; the parent does the API calls.
function DesignList(props: DesignListProps) {
  const { cards, loadStatus, loadError, actionError, openCardId, busyCardId } = props

  return (
    <section className="panel design-list">
      <h2>My designs</h2>

      {loadStatus === 'loading' && <p className="hint">Loading your designs…</p>}
      {loadStatus === 'error' && (
        <div>
          <p className="error-text">Couldn't load your designs: {loadError}</p>
          <button type="button" onClick={props.onRetry}>
            Try again
          </button>
        </div>
      )}
      {loadStatus === 'ready' && cards.length === 0 && <p className="hint">No saved designs yet. Save one to see it here.</p>}
      {actionError && <p className="error-text">{actionError}</p>}

      <ul>
        {cards.map((card) => {
          const busy = busyCardId === card._id
          return (
            <li key={card._id} className={card._id === openCardId ? 'design-item open' : 'design-item'}>
              <div className="design-info">
                <strong>{card.name}</strong>
                <span className="hint">
                  {NETWORK_NAMES[card.network]} •••• {card.cardLast4} · {formatDate(card.updatedAt)}
                </span>
                <span className={`status-badge ${card.status}`}>{card.status === 'final' ? 'Final' : 'Draft'}</span>
              </div>
              <div className="button-row">
                <button type="button" onClick={() => props.onOpen(card)} disabled={busy}>
                  Open
                </button>
                <button type="button" onClick={() => props.onToggleStatus(card)} disabled={busy}>
                  {card.status === 'final' ? 'Mark as draft' : 'Mark as final'}
                </button>
                <button type="button" className="danger" onClick={() => props.onDelete(card)} disabled={busy}>
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default DesignList
