import { useEffect, useRef, useState, type RefObject } from 'react'
import { Group, Layer, Rect, Stage, Text } from 'react-konva'
import type Konva from 'konva'
import LogoBadge, { BADGE_SIZE } from './LogoBadge'
import type { CoBrand, LogoId, Network, Point } from '../types'

// The card is designed on a 400 x 252 canvas (the same shape as a real card).
export const CARD_WIDTH = 400
export const CARD_HEIGHT = 252

// Each network gets its own background colour and a plain-text label.
// Plain text only: no real trademarked logos. 'unknown' is a generic card.
const NETWORK_STYLES: Record<Network, { background: string; label: string; fontSize: number; fontStyle: string }> = {
  visa: { background: '#1a1a2e', label: 'VISA', fontSize: 26, fontStyle: 'bold italic' },
  mastercard: { background: '#2e1a26', label: 'MASTERCARD', fontSize: 16, fontStyle: 'bold' },
  amex: { background: '#123a3a', label: 'AMEX', fontSize: 22, fontStyle: 'bold' },
  rupay: { background: '#1e2f1e', label: 'RuPay', fontSize: 22, fontStyle: 'bold italic' },
  unknown: { background: '#2b2b33', label: '', fontSize: 16, fontStyle: 'normal' },
}

type CardCanvasProps = {
  name: string
  numberText: string // already formatted or masked, ready to draw
  network: Network
  namePos: Point
  coBrand: CoBrand
  onNamePosChange: (pos: Point) => void
  stageRef: RefObject<Konva.Stage | null> // lets the parent export the canvas
}

// Keep the name fully inside the card while it is dragged.
function clampNamePos(x: number, y: number, width: number, height: number): Point {
  return {
    x: Math.round(Math.min(Math.max(x, 0), CARD_WIDTH - width)),
    y: Math.round(Math.min(Math.max(y, 0), CARD_HEIGHT - height)),
  }
}

// Where to draw the co-brand logos (top-right corner of the card).
function logoPositions(coBrand: CoBrand): { logo: LogoId; x: number; y: number }[] {
  const logos = [coBrand.primaryLogo, coBrand.secondaryLogo].filter((logo) => logo !== null)
  const right = CARD_WIDTH - 24 - BADGE_SIZE // x of the right-most badge
  const top = 24
  const gap = 8

  if (coBrand.layout === 'stacked') {
    // One under the other
    return logos.map((logo, i) => ({ logo, x: right, y: top + i * (BADGE_SIZE + gap) }))
  }
  // Side by side, with the primary logo on the left
  return logos.map((logo, i) => ({
    logo,
    x: right - (logos.length - 1 - i) * (BADGE_SIZE + gap),
    y: top,
  }))
}

function CardCanvas({ name, numberText, network, namePos, coBrand, onNamePosChange, stageRef }: CardCanvasProps) {
  // Measure how wide the space is, so the card shrinks to fit a phone screen
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(CARD_WIDTH)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Never draw bigger than the real design size, only smaller
  const scale = Math.min(1, containerWidth / CARD_WIDTH)
  const style = NETWORK_STYLES[network]

  return (
    <div ref={containerRef} className="canvas-wrapper">
      {/* The Stage is scaled, but every position below is in the 400 x 252 design units */}
      <Stage ref={stageRef} width={CARD_WIDTH * scale} height={CARD_HEIGHT * scale} scaleX={scale} scaleY={scale}>
        <Layer>
          {/* Card background */}
          <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={style.background} cornerRadius={16} />
          {/* Gold chip */}
          <Rect x={24} y={40} width={50} height={38} fill="#d4af37" cornerRadius={6} />

          {/* Co-brand logos */}
          <Group>
            {logoPositions(coBrand).map(({ logo, x, y }, i) => (
              <LogoBadge key={i} logo={logo} x={x} y={y} />
            ))}
          </Group>

          {/* Network label, right-aligned in the bottom-right corner */}
          <Text
            text={style.label}
            x={CARD_WIDTH - 24 - 200}
            y={206}
            width={200}
            align="right"
            fontSize={style.fontSize}
            fontStyle={style.fontStyle}
            fill="white"
          />

          {/* Card number */}
          <Text text={numberText} x={24} y={150} fontSize={22} fontFamily="Courier New, monospace" fill="white" />

          {/* Cardholder name: draggable, but kept inside the card */}
          <Text
            text={name || 'YOUR NAME'}
            x={namePos.x}
            y={namePos.y}
            fontSize={14}
            fill="white"
            draggable
            onDragMove={(e) => {
              const node = e.target
              const pos = clampNamePos(node.x(), node.y(), node.width(), node.height())
              node.position(pos) // stop Konva moving it past the edge
              onNamePosChange(pos)
            }}
          />
        </Layer>
      </Stage>
    </div>
  )
}

export default CardCanvas
