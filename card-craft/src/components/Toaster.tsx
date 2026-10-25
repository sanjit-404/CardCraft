import { useSyncExternalStore } from 'react'
import { dismissToast, getToasts, subscribeToToasts } from '../toast'

const ICONS = { success: '✓', error: '!', info: 'i' }

// Draws the toast messages in the corner. aria-live makes screen readers read them out.
function Toaster() {
  const toasts = useSyncExternalStore(subscribeToToasts, getToasts)

  return (
    <div className="toaster" aria-live="polite" role="status">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.kind}`}>
          <span className="toast-icon" aria-hidden="true">
            {ICONS[toast.kind]}
          </span>
          <p>{toast.message}</p>
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toaster
