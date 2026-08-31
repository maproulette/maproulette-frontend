/** Geometry and colouring for the roulette wheel face, in a 0-100 viewBox. */

/** Pocket order of a single-zero (European) wheel, clockwise from the 0. */
export const POCKET_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

export const CENTER = 50
export const POCKET_OUTER_RADIUS = 44
export const POCKET_INNER_RADIUS = 31
export const NUMBER_RADIUS = 37.5
export const BALL_RADIUS = 47
/** Where the ball comes to rest once it drops out of the apron, in the pockets. */
export const BALL_REST_RADIUS = 39.5

const POCKET_ANGLE = 360 / POCKET_ORDER.length

const point = (radius: number, degrees: number) => {
  const radians = ((degrees - 90) * Math.PI) / 180
  return {
    x: (CENTER + radius * Math.cos(radians)).toFixed(2),
    y: (CENTER + radius * Math.sin(radians)).toFixed(2),
  }
}

/** Annular sector for the pocket at `index`, first pocket centred at 12 o'clock. */
const pocketPath = (index: number): string => {
  const start = index * POCKET_ANGLE - POCKET_ANGLE / 2
  const end = start + POCKET_ANGLE
  const outerStart = point(POCKET_OUTER_RADIUS, start)
  const outerEnd = point(POCKET_OUTER_RADIUS, end)
  const innerEnd = point(POCKET_INNER_RADIUS, end)
  const innerStart = point(POCKET_INNER_RADIUS, start)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${POCKET_OUTER_RADIUS} ${POCKET_OUTER_RADIUS} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${POCKET_INNER_RADIUS} ${POCKET_INNER_RADIUS} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

const pocketFill = (value: number): string => {
  if (value === 0) return '#1f7a3d'
  return RED_NUMBERS.has(value) ? '#b81f27' : '#17171a'
}

export const POCKETS = POCKET_ORDER.map((value, index) => ({
  value,
  path: pocketPath(index),
  fill: pocketFill(value),
  /** Rotation that carries the label from 12 o'clock to this pocket, keeping it radial. */
  rotation: index * POCKET_ANGLE,
}))

/** Evenly spaced radial lines, used for the rim and cone seams. */
export const spokes = (count: number, innerRadius: number, outerRadius: number) =>
  Array.from({ length: count }, (_, index) => {
    const degrees = (index * 360) / count
    const from = point(innerRadius, degrees)
    const to = point(outerRadius, degrees)
    return { key: degrees, x1: from.x, y1: from.y, x2: to.x, y2: to.y }
  })

const normalizeAngle = (degrees: number) => ((degrees % 360) + 360) % 360

export interface LandedPocket {
  value: number
  fill: string
  /** Where the pocket sits on screen, clockwise from 12 o'clock. */
  screenAngle: number
  /** Pocket centre in viewBox units, which double as percentages of the square stage. */
  x: number
  y: number
}

/**
 * The pocket the ball came to rest in, given the final rotations of the wheel and of the
 * (counter-rotating) ball. Both layers spin about the same centre, so the pocket under the
 * ball is just their angular difference divided into slices.
 */
export const landedPocket = (wheelAngle: number, ballAngle: number): LandedPocket => {
  const index =
    Math.round(normalizeAngle(ballAngle - wheelAngle) / POCKET_ANGLE) % POCKET_ORDER.length
  const pocket = POCKETS[index]
  const screenAngle = normalizeAngle(wheelAngle + index * POCKET_ANGLE)
  const radians = ((screenAngle - 90) * Math.PI) / 180

  return {
    value: pocket.value,
    fill: pocket.fill,
    screenAngle,
    x: CENTER + NUMBER_RADIUS * Math.cos(radians),
    y: CENTER + NUMBER_RADIUS * Math.sin(radians),
  }
}
