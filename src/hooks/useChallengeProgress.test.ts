// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderHook } from '@/test/renderHook'
import type { CompletionMetrics } from '@/types/Challenge'
import { useChallengeProgress } from './useChallengeProgress'

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

  it('derives the total from summed status fields when total is missing', () => {
    // The backend sometimes omits `total` even when per-status counts are present.
    const { total: _, ...withoutTotal } = makeMetrics({ fixed: 2, available: 3, tooHard: 1 })

    const { result } = renderHook(() =>
      useChallengeProgress(withoutTotal as unknown as CompletionMetrics)
    )

    expect(result.current.total).toBe(6)
  })

  it('derives the total from summed status fields when total is zero', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(makeMetrics({ total: 0, fixed: 1, available: 1 }))
    )

    expect(result.current.total).toBe(2)
  })

  it('rounds the completion percentage', () => {
    const { result } = renderHook(() => useChallengeProgress(makeMetrics({ total: 3, fixed: 1 })))

    expect(result.current.completionPercentage).toBe(33)
  })

  it('counts falsePositive and alreadyFixed toward completion alongside fixed', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(makeMetrics({ total: 10, fixed: 2, falsePositive: 3, alreadyFixed: 1 }))
    )

    expect(result.current.completionPercentage).toBe(60)
  })

  it('builds one segment per non-zero completed status plus a gray remaining fill', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(makeMetrics({ total: 10, fixed: 2, falsePositive: 3, available: 5 }))
    )

    expect(result.current.segments).toEqual([
      { key: 'fixed', percentage: 20, color: '#22c55e', title: 'Fixed: 2' },
      { key: 'falsePositive', percentage: 30, color: '#facc15', title: 'Not an Issue: 3' },
      {
        key: 'remaining',
        percentage: 50,
        color: '#9ca3af',
        title: 'Remaining: 5',
        opacity: 0.45,
      },
    ])
  })

  it('omits the remaining fill segment once completed statuses reach 100%', () => {
    const { result } = renderHook(() => useChallengeProgress(makeMetrics({ total: 10, fixed: 10 })))

    expect(result.current.segments).toEqual([
      { key: 'fixed', percentage: 100, color: '#22c55e', title: 'Fixed: 10' },
    ])
  })

  it('gives tooHard its own red problem segment separate from the gray remaining fill', () => {
    const { result } = renderHook(() =>
      useChallengeProgress(makeMetrics({ total: 10, tooHard: 3, available: 7 }))
    )

    expect(result.current.completionPercentage).toBe(0)
    expect(result.current.segments).toEqual([
      {
        key: 'tooHard',
        percentage: 30,
        color: '#ef4444',
        title: "Can't Complete: 3",
        opacity: 0.55,
      },
      {
        key: 'remaining',
        percentage: 70,
        color: '#9ca3af',
        title: 'Remaining: 7',
        opacity: 0.45,
      },
    ])
  })

  it('omits the remaining fill when tooHard alone accounts for 100%', () => {
    const { result } = renderHook(() => useChallengeProgress(makeMetrics({ total: 3, tooHard: 3 })))

    expect(result.current.segments).toEqual([
      {
        key: 'tooHard',
        percentage: 100,
        color: '#ef4444',
        title: "Can't Complete: 3",
        opacity: 0.55,
      },
    ])
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
