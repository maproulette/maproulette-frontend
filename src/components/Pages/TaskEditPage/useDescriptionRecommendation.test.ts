// @vitest-environment happy-dom
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/api'
import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { resetSeenChallengeDescriptions } from '@/lib/challengeDescriptionSeen'
import { resetTaskArrivalLocks } from '@/lib/taskArrivalLocks'
import { renderHook } from '@/test/renderHook'
import type { Challenge } from '@/types/Challenge'
import type { TaskGetResponse } from '@/types/Task'
import { useDescriptionRecommendation } from './useDescriptionRecommendation'

vi.mock('@/api', () => ({ api: { user: { lockedTasks: vi.fn() } } }))
vi.mock('@/components/Pages/TaskEditPage/contexts/ChallengeContext', () => ({
  useChallengeContext: vi.fn(),
}))
vi.mock('@/components/Pages/TaskEditPage/contexts/TaskContext', () => ({
  useTaskContext: vi.fn(),
}))
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: vi.fn() }))

const USER_ID = 42
const TASK_ID = 102685
const CHALLENGE_ID = 7

/** A lock list entry, as /user/{id}/lockedTasks returns it. */
const lock = (id: number, parent = CHALLENGE_ID) => ({ id, parent })

type LockList = ReturnType<typeof lock>[]

const setup = ({
  lockedBy = null,
  heldLocks,
}: {
  lockedBy?: number | null
  heldLocks: LockList | undefined
}) => {
  vi.mocked(useChallengeContext).mockReturnValue({
    challenge: { id: CHALLENGE_ID, description: 'Read me first' } as Challenge,
  } as ReturnType<typeof useChallengeContext>)
  vi.mocked(useTaskContext).mockReturnValue({
    task: { id: TASK_ID, parent: CHALLENGE_ID, lockedBy } as TaskGetResponse,
  } as ReturnType<typeof useTaskContext>)
  vi.mocked(useAuthContext).mockReturnValue({ user: { id: USER_ID } } as ReturnType<
    typeof useAuthContext
  >)
  vi.mocked(api.user.lockedTasks).mockReturnValue({ data: heldLocks } as ReturnType<
    typeof api.user.lockedTasks
  >)
}

beforeEach(() => {
  sessionStorage.clear()
  resetSeenChallengeDescriptions()
  resetTaskArrivalLocks()
  vi.clearAllMocks()
})

describe('useDescriptionRecommendation', () => {
  it("says nothing until the mapper's locks are known", () => {
    setup({ heldLocks: undefined })
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(false)
  })

  it('nudges a mapper who arrived on a shared link holding no locks', () => {
    setup({ heldLocks: [] })
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(true)
  })

  it('keeps nudging when the mapper locks the task they arrived at', () => {
    // The lock list lands only after they hit lock, so it already holds this task - the
    // shape of a direct link followed by a claim.
    setup({ heldLocks: undefined })
    const { result, rerender } = renderHook(() => useDescriptionRecommendation())
    expect(result.current.recommended).toBe(false)

    setup({ lockedBy: USER_ID, heldLocks: [lock(TASK_ID)] })
    rerender()

    expect(result.current.recommended).toBe(true)
  })

  it('drops the nudge for a task whose lock the mapper already held on arrival', () => {
    setup({ lockedBy: USER_ID, heldLocks: [lock(TASK_ID)] })
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(false)
  })

  it('leaves a lock held by somebody else out of it', () => {
    setup({ lockedBy: 99, heldLocks: [] })
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(true)
  })

  it('drops the nudge when the mapper holds a lock elsewhere in the challenge', () => {
    setup({ heldLocks: [lock(TASK_ID + 1)] })
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(false)
  })

  it('ignores a lock held in some other challenge', () => {
    setup({ heldLocks: [lock(TASK_ID + 1, CHALLENGE_ID + 1)] })
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(true)
  })

  it('still nudges after a reload of the locked task, having arrived without the lock', () => {
    setup({ heldLocks: [] })
    const first = renderHook(() => useDescriptionRecommendation())
    expect(first.result.current.recommended).toBe(true)
    first.unmount()

    // Reloaded: the arrival verdict comes back from sessionStorage, while the live picture
    // now shows the lock they took in the meantime.
    resetTaskArrivalLocks()
    resetSeenChallengeDescriptions()
    setup({ lockedBy: USER_ID, heldLocks: [lock(TASK_ID)] })
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(true)
  })

  it('stops nudging once the description is read, and remembers it', () => {
    setup({ heldLocks: [] })
    const { result, unmount } = renderHook(() => useDescriptionRecommendation())
    expect(result.current.recommended).toBe(true)

    act(() => {
      result.current.markDescriptionRead()
    })
    expect(result.current.recommended).toBe(false)
    unmount()

    resetTaskArrivalLocks()
    resetSeenChallengeDescriptions()
    setup({ lockedBy: USER_ID, heldLocks: [lock(TASK_ID)] })
    const second = renderHook(() => useDescriptionRecommendation())

    expect(second.result.current.recommended).toBe(false)
  })

  it('never nudges towards a challenge with nothing written about it', () => {
    setup({ heldLocks: [] })
    vi.mocked(useChallengeContext).mockReturnValue({
      challenge: { id: CHALLENGE_ID } as Challenge,
    } as ReturnType<typeof useChallengeContext>)
    const { result } = renderHook(() => useDescriptionRecommendation())

    expect(result.current.recommended).toBe(false)
  })
})
