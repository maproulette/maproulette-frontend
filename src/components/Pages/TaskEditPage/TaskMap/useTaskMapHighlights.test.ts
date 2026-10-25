import { describe, expect, it } from 'vitest'
import { taskEmphasis } from './useTaskMapHighlights'

const none = {
  isPrimary: false,
  inBundle: false,
  isSelected: false,
  isActive: false,
  isLassoSelected: false,
  isHovered: false,
}

describe('taskEmphasis', () => {
  it('leaves an ordinary task alone', () => {
    expect(taskEmphasis(none)).toBeNull()
  })

  it('marks the primary task, even when it is also in the bundle or active', () => {
    expect(taskEmphasis({ ...none, isPrimary: true, inBundle: true, isActive: true })).toBe(
      'primary'
    )
  })

  it('lets hovering win over everything else', () => {
    expect(taskEmphasis({ ...none, isPrimary: true, isHovered: true })).toBe('hovered')
  })

  it('marks bundle members, and the one being viewed', () => {
    expect(taskEmphasis({ ...none, inBundle: true })).toBe('bundled')
    expect(taskEmphasis({ ...none, inBundle: true, isActive: true })).toBe('bundled-selected')
    expect(taskEmphasis({ ...none, inBundle: true, isSelected: true })).toBe('bundled-selected')
  })

  it('marks lassoed tasks, and the one being viewed', () => {
    expect(taskEmphasis({ ...none, isLassoSelected: true })).toBe('lasso')
    expect(taskEmphasis({ ...none, isLassoSelected: true, isSelected: true })).toBe(
      'lasso-selected'
    )
  })

  it('prefers bundle membership over a lasso selection', () => {
    expect(taskEmphasis({ ...none, inBundle: true, isLassoSelected: true })).toBe('bundled')
  })

  it('marks a selected task that is in neither the bundle nor the lasso', () => {
    expect(taskEmphasis({ ...none, isSelected: true })).toBe('selected')
    expect(taskEmphasis({ ...none, isActive: true })).toBe('selected')
  })
})
