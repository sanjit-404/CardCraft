import type { Network } from './types'

// Card finishes are purely visual. They are NEVER sent to the backend:
// we remember the choice for each saved design in this browser only.

export type FinishId = 'auto' | 'obsidian' | 'gold' | 'rose' | 'ocean' | 'holographic' | 'carbon'

export type Finish = {
  label: string
  stops: string[] // gradient colours, from the top-left corner to the bottom-right
  ink: string // colour of the text printed on the card
  highlight: string // a faint second copy of the text, for the embossed look
  shadow: string // shadow under the text
  glow: string // the soft coloured glow behind the card (CSS only)
  pattern: 'none' | 'carbon'
}

export const FINISHES: Record<Exclude<FinishId, 'auto'>, Finish> = {
  obsidian: {
    label: 'Obsidian',
    stops: ['#2e2e3b', '#15151d', '#060609'],
    ink: '#ececf4',
    highlight: 'rgba(255,255,255,0.18)',
    shadow: '#000000',
    glow: 'rgba(140, 140, 200, 0.35)',
    pattern: 'none',
  },
  gold: {
    label: 'Gold',
    stops: ['#f7e4a3', '#d6a94d', '#8f6420', '#e9c66f'],
    ink: '#3a2706',
    highlight: 'rgba(255,255,255,0.55)',
    shadow: '#ffffff',
    glow: 'rgba(230, 180, 80, 0.45)',
    pattern: 'none',
  },
  rose: {
    label: 'Rose',
    stops: ['#fad6d9', '#e39caa', '#b8657a', '#f1bcc4'],
    ink: '#45172a',
    highlight: 'rgba(255,255,255,0.5)',
    shadow: '#ffffff',
    glow: 'rgba(240, 140, 170, 0.4)',
    pattern: 'none',
  },
  ocean: {
    label: 'Ocean',
    stops: ['#0e6a8a', '#0a3b5e', '#06172c'],
    ink: '#e8f6ff',
    highlight: 'rgba(255,255,255,0.2)',
    shadow: '#000000',
    glow: 'rgba(40, 160, 220, 0.45)',
    pattern: 'none',
  },
  holographic: {
    label: 'Holographic',
    stops: ['#f7c6e8', '#c3d4ff', '#bff5e3', '#fbefb8', '#e2c6ff'],
    ink: '#262046',
    highlight: 'rgba(255,255,255,0.6)',
    shadow: '#ffffff',
    glow: 'rgba(200, 170, 255, 0.5)',
    pattern: 'none',
  },
  carbon: {
    label: 'Carbon',
    stops: ['#333333', '#1b1b1b', '#0c0c0c'],
    ink: '#e6e6e6',
    highlight: 'rgba(255,255,255,0.15)',
    shadow: '#000000',
    glow: 'rgba(170, 170, 170, 0.25)',
    pattern: 'carbon',
  },
}

// The order the picker shows them in. "Auto" picks a finish from the network.
export const FINISH_IDS: FinishId[] = ['auto', 'obsidian', 'gold', 'rose', 'ocean', 'holographic', 'carbon']

const NETWORK_FINISH: Record<Network, Exclude<FinishId, 'auto'>> = {
  visa: 'ocean',
  mastercard: 'rose',
  amex: 'gold',
  rupay: 'carbon',
  unknown: 'obsidian',
}

// Turn a picker choice into real colours ("auto" depends on the network)
export function resolveFinish(id: FinishId, network: Network): Finish {
  return FINISHES[id === 'auto' ? NETWORK_FINISH[network] : id]
}

// The gradient as CSS, for the small card thumbnails and swatches
export function finishGradient(finish: Finish): string {
  return `linear-gradient(135deg, ${finish.stops.join(', ')})`
}

// ---- Remembering the finish per saved design (this browser only) ----

const STORAGE_KEY = 'cardcraft-finishes'

function readAll(): Record<string, FinishId> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, FinishId>
  } catch {
    return {}
  }
}

export function getSavedFinish(cardId: string): FinishId {
  const saved = readAll()[cardId]
  return FINISH_IDS.includes(saved) ? saved : 'auto'
}

export function saveFinish(cardId: string, finish: FinishId): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [cardId]: finish }))
  } catch {
    // Storage blocked: the finish just won't be remembered
  }
}
