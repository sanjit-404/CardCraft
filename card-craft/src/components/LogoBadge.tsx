import { Circle, Ellipse, Group, Line, Star } from 'react-konva'
import type { LogoId } from '../types'

// Every badge is drawn in a 40 x 40 box: a coloured circle with a simple
// white shape on top. These are generic shapes I made up, not real logos.
export const BADGE_SIZE = 40

const BADGE_COLORS: Record<LogoId, string> = {
  orbit: '#6c63ff',
  wave: '#2a9df4',
  shield: '#e05d5d',
  leaf: '#3cb371',
  bolt: '#f0a500',
  star: '#c06cd6',
}

type LogoBadgeProps = {
  logo: LogoId
  x: number
  y: number
}

function LogoBadge({ logo, x, y }: LogoBadgeProps) {
  return (
    <Group x={x} y={y}>
      <Circle x={20} y={20} radius={20} fill={BADGE_COLORS[logo]} />
      <BadgeShape logo={logo} />
    </Group>
  )
}

// The white shape inside the circle. Coordinates are inside the 40 x 40 box.
function BadgeShape({ logo }: { logo: LogoId }) {
  switch (logo) {
    case 'orbit': // a planet with a tilted ring around it
      return (
        <Group>
          <Ellipse x={20} y={20} radiusX={15} radiusY={6} rotation={-20} stroke="white" strokeWidth={2} />
          <Circle x={20} y={20} radius={6} fill="white" />
        </Group>
      )
    case 'wave': // two wavy lines
      return (
        <Group>
          <Line points={[7, 17, 13, 12, 20, 17, 27, 12, 33, 17]} tension={0.5} stroke="white" strokeWidth={3} lineCap="round" />
          <Line points={[7, 25, 13, 20, 20, 25, 27, 20, 33, 25]} tension={0.5} stroke="white" strokeWidth={3} lineCap="round" />
        </Group>
      )
    case 'shield': // a shield outline, filled
      return <Line points={[20, 7, 31, 11, 29, 24, 20, 33, 11, 24, 9, 11]} closed fill="white" />
    case 'leaf': // a slanted oval with a line down the middle
      return (
        <Group>
          <Ellipse x={20} y={20} radiusX={7} radiusY={14} rotation={45} fill="white" />
          <Line points={[12, 28, 28, 12]} stroke={BADGE_COLORS.leaf} strokeWidth={2} />
        </Group>
      )
    case 'bolt': // a lightning bolt
      return <Line points={[23, 6, 12, 22, 19, 22, 16, 34, 28, 17, 21, 17, 24, 6]} closed fill="white" />
    case 'star': // a five-pointed star
      return <Star x={20} y={20} numPoints={5} innerRadius={6} outerRadius={13} fill="white" />
  }
}

export default LogoBadge
