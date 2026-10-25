import { getSession } from './session'
import type { Card, CardStatus, CoBrand, Point, Review, Session } from './types'

// The backend's address comes from the VITE_API_URL environment variable
// (set on Vercel). Locally it falls back to the Express dev server.
// Any trailing "/" is removed so we can always write API_URL + '/api/...'.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

// One problem in a validation error, e.g. { field: 'name', message: 'Required' }.
// Problems not about one field use field "body".
export type FieldIssue = { field: string; message: string }

// Every failed request becomes an ApiError, so the screens can show
// err.message and check err.status (e.g. 503 for "AI review unavailable").
export class ApiError extends Error {
  status: number
  details: FieldIssue[]

  constructor(status: number, message: string, details: FieldIssue[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// The app registers a function here that logs the user out. We call it when
// a /api/cards request comes back 401 (missing, invalid or expired token).
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

// The one place that talks to the backend. It adds the JSON header and the
// Bearer token, and turns error responses into an ApiError.
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getSession()?.token
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // fetch only throws when the server can't be reached at all
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.")
  }

  // 204 No Content (a successful delete) has no body to read
  if (response.status === 204) return undefined as T

  // Read the body as text first, so a non-JSON reply doesn't crash us
  const text = await response.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    // A 401 on a card route means our token is no longer good: log out.
    // A 401 on /api/auth/login just means a wrong email or password.
    if (response.status === 401 && path.startsWith('/api/cards')) {
      onUnauthorized?.()
    }
    const errorBody = (data ?? {}) as { error?: string; details?: FieldIssue[] }
    throw new ApiError(
      response.status,
      errorBody.error || `Request failed (status ${response.status})`,
      Array.isArray(errorBody.details) ? errorBody.details : [],
    )
  }

  return data as T
}

// Turn any error into one friendly sentence to show on screen.
// Validation errors list each problem, e.g. "name: Name is required".
export function describeError(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.'
  if (err.details.length > 0) {
    return err.details
      .map((issue) => (issue.field === 'body' ? issue.message : `${issue.field}: ${issue.message}`))
      .join('. ')
  }
  return err.message
}

// ---- Auth ----

export function register(email: string, password: string): Promise<Session> {
  return request<Session>('POST', '/api/auth/register', { email, password })
}

export function login(email: string, password: string): Promise<Session> {
  return request<Session>('POST', '/api/auth/login', { email, password })
}

// ---- Cards ----

// What we send when saving. The client never sends "network": the server works it out.
// coBrand must always be the whole object (all three fields).
export type CardCreateInput = {
  name: string
  cardNumber: string
  namePos?: Point
  status?: CardStatus
  coBrand?: CoBrand
}

// An update can send any of the fields (at least one). cardNumber is only
// included when the user typed a new number.
export type CardUpdateInput = Partial<CardCreateInput>

export function listCards(): Promise<Card[]> {
  return request<Card[]>('GET', '/api/cards')
}

export function createCard(input: CardCreateInput): Promise<Card> {
  return request<Card>('POST', '/api/cards', input)
}

export function updateCard(id: string, input: CardUpdateInput): Promise<Card> {
  return request<Card>('PUT', `/api/cards/${encodeURIComponent(id)}`, input)
}

export function deleteCard(id: string): Promise<void> {
  return request<void>('DELETE', `/api/cards/${encodeURIComponent(id)}`)
}

export function reviewCard(id: string): Promise<Review> {
  return request<Review>('POST', `/api/cards/${encodeURIComponent(id)}/review`)
}
