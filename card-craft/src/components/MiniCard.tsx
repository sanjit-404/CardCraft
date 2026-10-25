import type { CSSProperties } from 'react'
import { BADGE_COLORS } from '../logos'
import { finishGradient, type Finish } from '../finishes'
import type { CoBrand, Network } from '../types'

const NETWORK_LABELS: Record<Network, string> = {
  visa: 'VISA',
  mastercard: 'mastercard',
  amex: 'AMEX',
  rupay: 'RuPay',
  unknown: '',
}

type MiniCardProps = {
  name: string
  numberText: string
  network: Network
  finish: Finish
  coBrand?: CoBrand
}

// A lightweight card drawn with plain HTML and CSS (no canvas), used for the
// "My designs" thumbnails and the demo card on the login page.
// Text sizes use "cqw" units, so it scales with its own width.
function MiniCard({ name, numberText, network, finish, coBrand }: MiniCardProps) {
  const logos = coBrand ? [coBrand.primaryLogo, coBrand.secondaryLogo].filter((logo) => logo !== null) : []

  return (
    <div
      className="mini-card"
      style={{ background: finishGradient(finish), color: finish.ink, '--glow': finish.glow } as CSSProperties}
      aria-hidden="true"
    >
      <span className="mini-chip" />
      {logos.length > 0 && (
        <span className={`mini-logos ${coBrand?.layout === 'stacked' ? 'stacked' : ''}`}>
          {logos.map((logo, i) => (
            <span key={i} className="mini-logo" style={{ background: BADGE_COLORS[logo] }} />
          ))}
        </span>
      )}
      <span className="mini-number">{numberText}</span>
      <span className="mini-name">{name.toUpperCase()}</span>
      <span className={`mini-network network-${network}`}>{NETWORK_LABELS[network]}</span>
      <span className="mini-sheen" />
    </div>
  )
}

export default MiniCard
