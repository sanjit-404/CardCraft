import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

type TiltCardProps = {
  children: ReactNode
  radius: number // corner radius in screen pixels, to match the canvas card
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Wraps the canvas with CSS-only effects: a slight 3D tilt that follows the
// mouse, a light glare and a sweeping holographic sheen. None of this is
// drawn on the canvas, so PNG/PDF exports stay clean.
// We change CSS variables directly on the element instead of using state,
// so moving the mouse never re-renders the Konva canvas.
function TiltCard({ children, radius }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  function resetTilt() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.classList.remove('is-hovered')
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current
    // Mouse only: no tilt for touch, while dragging the name, or for reduced motion
    if (!el || e.pointerType !== 'mouse' || isDragging.current || prefersReducedMotion()) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0 = left edge, 1 = right edge
    const py = (e.clientY - rect.top) / rect.height
    el.style.setProperty('--rx', `${((0.5 - py) * 10).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((px - 0.5) * 12).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    el.classList.add('is-hovered')
  }

  // Flatten the card while the name is dragged, so the drag follows the mouse exactly
  function handlePointerDown() {
    isDragging.current = true
    resetTilt()
    window.addEventListener(
      'pointerup',
      () => {
        isDragging.current = false
      },
      { once: true },
    )
  }

  return (
    <div
      ref={ref}
      className="tilt-card"
      style={{ '--radius': `${radius}px` } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerDown={handlePointerDown}
    >
      {children}
      <div className="card-sheen" aria-hidden="true" />
      <div className="card-glare" aria-hidden="true" />
    </div>
  )
}

export default TiltCard
