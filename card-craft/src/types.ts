// Shared types that match the backend API contract exactly.

// The five card networks. The backend works out the network itself when a
// number is saved; the frontend only detects it to draw the live preview.
export type Network = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'unknown'

// The only logo IDs the backend accepts. "as const" lets TypeScript build the
// LogoId type from this list, so the list and the type can never drift apart.
export const LOGO_IDS = ['orbit', 'wave', 'shield', 'leaf', 'bolt', 'star'] as const
export type LogoId = (typeof LOGO_IDS)[number]

export type CoBrandLayout = 'side-by-side' | 'stacked'

// Co-branding must always be sent whole: all three fields, null for "no logo".
export type CoBrand = {
  primaryLogo: LogoId | null
  secondaryLogo: LogoId | null
  layout: CoBrandLayout
}

export const DEFAULT_CO_BRAND: CoBrand = {
  primaryLogo: null,
  secondaryLogo: null,
  layout: 'side-by-side',
}

export type CardStatus = 'draft' | 'final'

export type Point = { x: number; y: number }

// A saved card exactly as the API returns it. Only the last 4 digits of the
// number are ever stored, so the full number is never sent back to us.
export type Card = {
  _id: string
  name: string
  cardLast4: string
  network: Network
  coBrand: CoBrand
  namePos: Point
  status: CardStatus
  createdAt: string
  updatedAt: string
}

export type User = { id: string; email: string }

// What register and login return. We also keep this in localStorage as the "session".
export type Session = { token: string; user: User }

export type Review = { score: number; tips: string[] }
