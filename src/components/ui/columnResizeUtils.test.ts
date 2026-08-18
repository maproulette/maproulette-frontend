import { describe, expect, it } from 'vitest'
import { computeResizedWidth, computeTotalWidth, MIN_COLUMN_WIDTH } from './columnResizeUtils'

describe('computeResizedWidth', () => {
  it('grows the width by the drag delta', () => {
    expect(computeResizedWidth(100, 50, 80)).toBe(130)
  })

  it('shrinks the width by the drag delta', () => {
    expect(computeResizedWidth(100, 50, 20)).toBe(70)
  })

  it('clamps to the minimum width when dragged below it', () => {
    expect(computeResizedWidth(50, 50, -1000)).toBe(MIN_COLUMN_WIDTH)
  })

  it('honors a custom minimum width', () => {
    expect(computeResizedWidth(100, 50, 0, 80)).toBe(80)
  })
})

describe('computeTotalWidth', () => {
  it('sums the given widths', () => {
    expect(computeTotalWidth([100, 200, 50])).toBe(350)
  })

  it('returns 0 for an empty list', () => {
    expect(computeTotalWidth([])).toBe(0)
  })
})
