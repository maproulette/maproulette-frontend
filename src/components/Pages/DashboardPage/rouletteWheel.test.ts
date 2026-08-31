import { describe, expect, it } from 'vitest'
import { landedPocket, POCKET_ORDER, POCKETS, spokes } from './rouletteWheel'

describe('POCKET_ORDER', () => {
  it('is a single-zero wheel: 0-36 exactly once each', () => {
    expect([...POCKET_ORDER].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 37 }, (_, index) => index)
    )
  })
})

describe('POCKETS', () => {
  it('colours the zero green and alternates red and black across the rest', () => {
    const fillFor = (value: number) => POCKETS.find((pocket) => pocket.value === value)?.fill

    expect(fillFor(0)).toBe('#1f7a3d')
    expect(fillFor(32)).toBe('#b81f27')
    expect(fillFor(15)).toBe('#17171a')
    expect(POCKETS.filter((pocket) => pocket.fill === '#b81f27')).toHaveLength(18)
    expect(POCKETS.filter((pocket) => pocket.fill === '#17171a')).toHaveLength(18)
  })

  it('spreads the pockets evenly around the wheel, starting at 12 oclock', () => {
    expect(POCKETS[0].rotation).toBe(0)
    expect(POCKETS[1].rotation).toBeCloseTo(360 / 37)
    expect(POCKETS.at(-1)?.rotation).toBeCloseTo(360 - 360 / 37)
  })
})

describe('spokes', () => {
  it('returns evenly spaced segments between the two radii', () => {
    const result = spokes(4, 10, 20)

    expect(result).toHaveLength(4)
    // First spoke points straight up from the centre.
    expect(result[0]).toMatchObject({ x1: '50.00', y1: '40.00', x2: '50.00', y2: '30.00' })
    expect(new Set(result.map((spoke) => spoke.key)).size).toBe(4)
  })
})

describe('landedPocket', () => {
  const STEP = 360 / 37

  it('lands on the zero when nothing has moved', () => {
    expect(landedPocket(0, 0)).toMatchObject({ value: 0, screenAngle: 0, x: 50 })
  })

  it('reads the pocket from the angle between the ball and the wheel', () => {
    // Ball two slices clockwise of the wheel's zero.
    expect(landedPocket(0, 2 * STEP).value).toBe(POCKET_ORDER[2])
    // Same relative offset, wheel itself parked elsewhere.
    expect(landedPocket(90, 90 + 2 * STEP).value).toBe(POCKET_ORDER[2])
  })

  it('normalises the many turns of a real spin down to one pocket', () => {
    const wheel = 360 * 9 + 40
    const ball = -(360 * 17) - 100
    const landed = landedPocket(wheel, ball)

    expect(POCKET_ORDER).toContain(landed.value)
    expect(landed.screenAngle).toBeGreaterThanOrEqual(0)
    expect(landed.screenAngle).toBeLessThan(360)
    // Sits on the ring of numbers, not the hub or the apron.
    expect(Math.hypot(landed.x - 50, landed.y - 50)).toBeCloseTo(37.5)
  })

  it('puts the landed pocket where the ball is', () => {
    const landed = landedPocket(0, 3 * STEP)

    expect(landed.screenAngle).toBeCloseTo(3 * STEP)
    expect(landed.x).toBeGreaterThan(50)
    expect(landed.y).toBeLessThan(50)
  })
})
