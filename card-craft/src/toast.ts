// A tiny toast (pop-up message) store. Any file can call showToast(), and the
// <Toaster /> component listens for changes and draws the messages.

export type ToastKind = 'success' | 'error' | 'info'
export type Toast = { id: number; kind: ToastKind; message: string }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function showToast(message: string, kind: ToastKind = 'info'): void {
  const id = nextId++
  toasts = [...toasts, { id, kind, message }]
  notify()
  // Errors stay a little longer so there is time to read them
  setTimeout(() => dismissToast(id), kind === 'error' ? 7000 : 4000)
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((toast) => toast.id !== id)
  notify()
}

// Used by React's useSyncExternalStore in <Toaster />
export function subscribeToToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts(): Toast[] {
  return toasts
}
