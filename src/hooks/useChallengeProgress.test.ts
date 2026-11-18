// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import type { CompletionMetrics } from '@/types/Challenge'

vi.mock('@/i18n', async () => {
  const { testT } = await import('@/test/translate')
  return { useIntl: () => ({ t: testT }) }
})

const { useChallengeProgress } = await import('./useChallengeProgress')

const makeMetrics = (overrides: Partial<CompletionMetrics> = {}): CompletionMetrics => ({
  total: 0,
  available: 0,
  fixed: 0,
  falsePositive: 0,
  skipped: 0,
  deleted: 0,
  alreadyFixed: 0,
  tooHard: 0,
  answered: 0,
  validated: 0,
  disabled: 0,
  tasksRemaining: 0,
  ...overrides,
})

describe('useChallengeProgress', () => {
  it('derives progress from the provided metrics', () => {
    const metrics = makeMetrics({ total: 10, available: 5, fixed: 5, tasksRemaining: 5 })

    const { result } = renderHook(() => useChallengeProgress(metrics))

    expect(result.current.total).toBe(10)
    expect(result.current.completionPercentage).toBe(50)
    expect(result.current.hasActions).toBe(true)
    expect(result.current.tasksRemaining).toBe(5)
  })

  it('leaves deleted and disabled tasks out of the total', () => {
    // The backend's own total counts them, but they aren't work anyone can do.
    const { result } = renderHook(() =>
      useChallengeProgress(
        makeMetrics({ total: 20, fixed: 6, available: 4, deleted: 3, disabled: 7 })
      )
    )

    expect(result.current.total).toBe(10)
    expect(result.current.completionPercentage).toBe(60)
  })

  it('rounds the completion percentage', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(makeMetrics({ total: 3, fixed: 1, available: 2 }))
    )

    expect(result.current.completionPercentage).toBe(33)
  })

  it('counts falsePositive and alreadyFixed toward completion alongside fixed', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(
        makeMetrics({ total: 10, fixed: 2, falsePositive: 3, alreadyFixed: 1, available: 4 })
      )
    )

    expect(result.current.completionPercentage).toBe(60)
  })

  it('builds segments for completed statuses then tooHard, leaving the rest unfilled', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(
        makeMetrics({
          total: 10,
          fixed: 2,
          falsePositive: 3,
          alreadyFixed: 1,
          tooHard: 1,
          skipped: 1,
          available: 2,
        })
      )
    )

    expect(
      result.current.segments.map(({ key, percentage, title }) => ({ key, percentage, title }))
    ).toEqual([
      { key: 'fixed', percentage: 20, title: 'Fixed: 2' },
      { key: 'alreadyFixed', percentage: 10, title: 'Already Fixed: 1' },
      { key: 'falsePositive', percentage: 30, title: 'Not an Issue: 3' },
      { key: 'tooHard', percentage: 10, title: "Can't Complete: 1" },
    ])
  })

  it('omits statuses with no tasks', () => {
    const { result } = renderHook(() => useChallengeProgress(makeMetrics({ total: 10, fixed: 10 })))

    expect(result.current.segments.map((s) => s.key)).toEqual(['fixed'])
  })

  it('returns no segments when there are no tasks at all', () => {
    const { result } = renderHook(() => useChallengeProgress(makeMetrics()))

    expect(result.current.segments).toEqual([])
    expect(result.current.hasActions).toBe(false)
    expect(result.current.tasksRemaining).toBe(0)
  })

  it('computes tasksRemaining from available, skipped, and tooHard', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(
        makeMetrics({ total: 20, available: 4, skipped: 2, tooHard: 1, fixed: 13 })
      )
    )

    expect(result.current.tasksRemaining).toBe(7)
  })
})
