import type { Session } from './types'

// Where the login token and user live in the browser, so a page refresh
// keeps you logged in.
const STORAGE_KEY = 'cardcraft-session'

export function getSession(): Session | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const session = JSON.parse(saved) as Session
    // Only trust the saved value if it has the shape we expect
    if (typeof session.token !== 'string' || typeof session.user?.email !== 'string') return null
    return session
  } catch {
    // localStorage can be blocked (private mode) or hold broken JSON
    return null
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // If storage is blocked the user stays logged in until they refresh
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear if storage is blocked
  }
}
