// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { api } from '@/api'
import { renderHook } from '@/test/renderHook'
import type { CompletionMetrics } from '@/types/Challenge'
import { useChallengeProgress } from './useChallengeProgress'

vi.mock('@/api', () => ({
  api: { challenge: { getChallengeStats: vi.fn() } },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ isAuthenticated: true }),
}))

type ChallengeStatsData = ReturnType<typeof api.challenge.getChallengeStats>['data']

const mockStats = (data: ChallengeStatsData) => {
  vi.mocked(api.challenge.getChallengeStats).mockReturnValue({
    data,
  } as unknown as ReturnType<typeof api.challenge.getChallengeStats>)
}

describe('useChallengeProgress', () => {
  it('returns zeroed-out values when there is no data and no fallback', () => {
    mockStats(undefined)

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current).toEqual({
      completionPercentage: 0,
      segments: [],
      hasActions: false,
      total: 0,
      tasksRemaining: 0,
    })
  })

  it('returns zeroed-out values when challengeStatsData is an empty array', () => {
    mockStats([])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.total).toBe(0)
    expect(result.current.hasActions).toBe(false)
  })

  it('falls back to the provided metrics when challengeStatsData has no actions', () => {
    mockStats(undefined)
    const fallback: CompletionMetrics = {
      total: 10,
      available: 5,
      fixed: 5,
      falsePositive: 0,
      skipped: 0,
      deleted: 0,
      alreadyFixed: 0,
      tooHard: 0,
      answered: 0,
      validated: 0,
      disabled: 0,
      tasksRemaining: 5,
    }

    const { result } = renderHook(() => useChallengeProgress(1, fallback))

    expect(result.current.total).toBe(10)
    expect(result.current.completionPercentage).toBe(50)
    expect(result.current.hasActions).toBe(true)
    expect(result.current.tasksRemaining).toBe(5)
  })

  it('prefers per-challenge stats over the fallback when both are present', () => {
    mockStats([{ actions: { total: 4, fixed: 4 } }])
    const fallback: CompletionMetrics = {
      total: 999,
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
    }

    const { result } = renderHook(() => useChallengeProgress(1, fallback))

    expect(result.current.total).toBe(4)
    expect(result.current.completionPercentage).toBe(100)
  })

  it('derives the total from summed status fields when actions.total is missing', () => {
    mockStats([{ actions: { fixed: 2, available: 3, tooHard: 1 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.total).toBe(6)
  })

  it('derives the total from summed status fields when actions.total is zero', () => {
    mockStats([{ actions: { total: 0, fixed: 1, available: 1 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.total).toBe(2)
  })

  it('rounds the completion percentage', () => {
    mockStats([{ actions: { total: 3, fixed: 1 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.completionPercentage).toBe(33)
  })

  it('counts falsePositive and alreadyFixed toward completion alongside fixed', () => {
    mockStats([{ actions: { total: 10, fixed: 2, falsePositive: 3, alreadyFixed: 1 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.completionPercentage).toBe(60)
  })

  it('builds one segment per non-zero completed status plus a gray remaining fill', () => {
    mockStats([
      { actions: { total: 10, fixed: 2, falsePositive: 3, alreadyFixed: 0, available: 5 } },
    ])

    const { result } = renderHook(() => useChallengeProgress(1))

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
    mockStats([{ actions: { total: 10, fixed: 10 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.segments).toEqual([
      { key: 'fixed', percentage: 100, color: '#22c55e', title: 'Fixed: 10' },
    ])
  })

  it('gives tooHard its own red problem segment separate from the gray remaining fill', () => {
    mockStats([{ actions: { total: 10, tooHard: 3, available: 7 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

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
    mockStats([{ actions: { total: 3, tooHard: 3 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

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

  it('returns no segments when there are no actions at all', () => {
    mockStats([{ actions: { total: 0 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.segments).toEqual([])
    expect(result.current.hasActions).toBe(false)
  })

  it('computes tasksRemaining from available, skipped, and tooHard', () => {
    mockStats([{ actions: { total: 20, available: 4, skipped: 2, tooHard: 1, fixed: 13 } }])

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.tasksRemaining).toBe(7)
  })

  it('defaults tasksRemaining to 0 when counts are absent', () => {
    mockStats(undefined)

    const { result } = renderHook(() => useChallengeProgress(1))

    expect(result.current.tasksRemaining).toBe(0)
  })
})
