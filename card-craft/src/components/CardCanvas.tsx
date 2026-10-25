import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Arc, Circle, Group, Layer, Line, Rect, Stage, Text } from 'react-konva'
import type Konva from 'konva'
import LogoBadge, { BADGE_SIZE } from './LogoBadge'
import TiltCard from './TiltCard'
import type { Finish } from '../finishes'
import type { CoBrand, LogoId, Network, Point } from '../types'

// The card is designed on a 400 x 252 canvas (the same shape as a real card).
export const CARD_WIDTH = 400
export const CARD_HEIGHT = 252
const CARD_RADIUS = 16
// On big screens the card is drawn up to 1.5x larger (it stays sharp: it's vector)
const MAX_SCALE = 1.5

// Network names as styled text only: no real trademarked logos.
// 'unknown' is a generic card with no network name.
const NETWORK_TEXT: Record<Network, { label: string; fontFamily: string; fontSize: number; fontStyle: string; letterSpacing: number }> = {
  visa: { label: 'VISA', fontFamily: 'Syne, sans-serif', fontSize: 30, fontStyle: 'italic 800', letterSpacing: 1 },
  mastercard: { label: 'mastercard', fontFamily: 'Manrope, sans-serif', fontSize: 18, fontStyle: '800', letterSpacing: 0.5 },
  amex: { label: 'AMEX', fontFamily: 'Syne, sans-serif', fontSize: 24, fontStyle: '800', letterSpacing: 4 },
  rupay: { label: 'RuPay', fontFamily: 'Manrope, sans-serif', fontSize: 24, fontStyle: 'italic 800', letterSpacing: 0 },
  unknown: { label: '', fontFamily: 'Manrope, sans-serif', fontSize: 16, fontStyle: 'normal', letterSpacing: 0 },
}

type CardCanvasProps = {
  name: string
  numberText: string // already formatted or masked, ready to draw
  network: Network
  finish: Finish
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
    return logos.map((logo, i) => ({ logo, x: right, y: top + i * (BADGE_SIZE + gap) }))
  }
  // Side by side, with the primary logo on the left
  return logos.map((logo, i) => ({ logo, x: right - (logos.length - 1 - i) * (BADGE_SIZE + gap), y: top }))
}

// Draw the card's rounded outline, so decorations are cut off at the corners
function clipToCard(ctx: Konva.Context) {
  const r = CARD_RADIUS
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.arcTo(CARD_WIDTH, 0, CARD_WIDTH, CARD_HEIGHT, r)
  ctx.arcTo(CARD_WIDTH, CARD_HEIGHT, 0, CARD_HEIGHT, r)
  ctx.arcTo(0, CARD_HEIGHT, 0, 0, r)
  ctx.arcTo(0, 0, CARD_WIDTH, 0, r)
  ctx.closePath()
}

// Konva wants gradient colours as [position, colour, position, colour, ...]
function colorStops(colors: string[]): (number | string)[] {
  return colors.flatMap((color, i) => [i / (colors.length - 1), color])
}

// The canvas only draws with a web font once it has loaded, so we wait for
// our three card fonts and then redraw.
function loadCardFonts(): Promise<unknown> {
  return Promise.all([
    document.fonts.load('700 23px "Space Mono"'),
    document.fonts.load('800 30px Syne'),
    document.fonts.load('800 18px Manrope'),
  ])
}

function CardCanvas({ name, numberText, network, finish, namePos, coBrand, onNamePosChange, stageRef }: CardCanvasProps) {
  // Measure how wide the space is, so the card fits any screen
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(CARD_WIDTH)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    loadCardFonts()
      .then(() => setFontsReady(true))
      .catch(() => setFontsReady(true)) // fall back to system fonts
  }, [])

  const scale = Math.min(MAX_SCALE, containerWidth / CARD_WIDTH)
  const networkText = NETWORK_TEXT[network]

  // Shared settings for the embossed (raised) text look
  const embossed = {
    fill: finish.ink,
    shadowColor: finish.shadow,
    shadowOffsetX: 1,
    shadowOffsetY: 1.5,
    shadowBlur: 1.5,
    shadowOpacity: 0.55,
  }

  return (
    <div ref={containerRef} className="card-hero" style={{ '--glow': finish.glow } as CSSProperties}>
      <TiltCard radius={CARD_RADIUS * scale}>
        {/* The Stage is scaled, but every position below is in the 400 x 252 design units */}
        <Stage ref={stageRef} width={CARD_WIDTH * scale} height={CARD_HEIGHT * scale} scaleX={scale} scaleY={scale}>
          {/* The key redraws everything once the web fonts have loaded */}
          <Layer key={fontsReady ? 'fonts-loaded' : 'fonts-loading'}>
            {/* Card body with the finish gradient */}
            <Rect
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              cornerRadius={CARD_RADIUS}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: CARD_WIDTH, y: CARD_HEIGHT }}
              fillLinearGradientColorStops={colorStops(finish.stops)}
            />

            {/* Soft light spots and texture, cut to the card's rounded shape */}
            <Group clipFunc={clipToCard}>
              <Circle
                x={340}
                y={20}
                radius={220}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndRadius={220}
                fillRadialGradientColorStops={[0, 'rgba(255,255,255,0.22)', 1, 'rgba(255,255,255,0)']}
              />
              <Circle
                x={30}
                y={270}
                radius={200}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndRadius={200}
                fillRadialGradientColorStops={[0, 'rgba(0,0,0,0.25)', 1, 'rgba(0,0,0,0)']}
              />
              {finish.pattern === 'carbon' &&
                Array.from({ length: 95 }, (_, i) => {
                  const x = -CARD_HEIGHT + i * 7
                  return (
                    <Line key={i} points={[x, 0, x + CARD_HEIGHT, CARD_HEIGHT]} stroke="white" strokeWidth={3} opacity={0.035} />
                  )
                })}
            </Group>

            {/* Thin bright edge, like the rim of a real card */}
            <Rect
              x={0.5}
              y={0.5}
              width={CARD_WIDTH - 1}
              height={CARD_HEIGHT - 1}
              cornerRadius={CARD_RADIUS}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={1}
            />

            {/* Gold chip with contact lines */}
            <Group x={28} y={44}>
              <Rect
                width={50}
                height={38}
                cornerRadius={7}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 50, y: 38 }}
                fillLinearGradientColorStops={[0, '#f6dd92', 0.5, '#c9973a', 1, '#f0cf7a']}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth={1}
              />
              <Line points={[0, 13, 50, 13]} stroke="rgba(0,0,0,0.28)" strokeWidth={1} />
              <Line points={[0, 25, 50, 25]} stroke="rgba(0,0,0,0.28)" strokeWidth={1} />
              <Line points={[17, 0, 17, 13]} stroke="rgba(0,0,0,0.28)" strokeWidth={1} />
              <Line points={[33, 25, 33, 38]} stroke="rgba(0,0,0,0.28)" strokeWidth={1} />
            </Group>

            {/* Contactless symbol: three curved lines */}
            {[8, 14, 20].map((r) => (
              <Arc
                key={r}
                x={90}
                y={63}
                innerRadius={r}
                outerRadius={r + 2}
                angle={80}
                rotation={-40}
                fill={finish.ink}
                opacity={0.7}
              />
            ))}

            {/* Co-brand logos */}
            {logoPositions(coBrand).map(({ logo, x, y }, i) => (
              <LogoBadge key={i} logo={logo} x={x} y={y} />
            ))}

            {/* Card number: a faint highlight copy plus the main text = embossed look */}
            <Text text={numberText} x={27} y={145} fontSize={23} fontFamily="Space Mono, monospace" fontStyle="700" letterSpacing={1} fill={finish.highlight} />
            <Text text={numberText} x={28} y={146} fontSize={23} fontFamily="Space Mono, monospace" fontStyle="700" letterSpacing={1} {...embossed} />

            {/* Network name, right-aligned in the bottom-right corner */}
            <Text
              text={networkText.label}
              x={CARD_WIDTH - 24 - 200}
              y={CARD_HEIGHT - 26 - networkText.fontSize}
              width={200}
              align="right"
              fontSize={networkText.fontSize}
              fontFamily={networkText.fontFamily}
              fontStyle={networkText.fontStyle}
              letterSpacing={networkText.letterSpacing}
              {...embossed}
            />

            {/* Cardholder name: draggable, but kept inside the card */}
            <Text
              text={(name || 'Your name').toUpperCase()}
              x={namePos.x}
              y={namePos.y}
              fontSize={15}
              fontFamily="Manrope, sans-serif"
              fontStyle="700"
              letterSpacing={1.5}
              {...embossed}
              draggable
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = 'grab'
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = ''
              }}
              onDragMove={(e) => {
                const node = e.target
                const pos = clampNamePos(node.x(), node.y(), node.width(), node.height())
                node.position(pos) // stop Konva moving it past the edge
                onNamePosChange(pos)
              }}
            />
          </Layer>
        </Stage>
      </TiltCard>
    </div>
  )
}

export default CardCanvas
