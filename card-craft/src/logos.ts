import type { LogoId } from './types'

// The background colour of each co-brand badge. Shared by the canvas badge
// (LogoBadge) and the small CSS thumbnails (MiniCard).
export const BADGE_COLORS: Record<LogoId, string> = {
  orbit: '#6c63ff',
  wave: '#2a9df4',
  shield: '#e05d5d',
  leaf: '#3cb371',
  bolt: '#f0a500',
  star: '#c06cd6',
}
