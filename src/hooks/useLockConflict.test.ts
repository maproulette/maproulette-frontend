// @vitest-environment happy-dom
import type { NormalizedOptions } from 'ky'
import { HTTPError } from 'ky'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { api } from '@/api'
import { renderHook } from '@/test/renderHook'
import { useLockConflict } from './useLockConflict'

vi.mock('@/api', () => ({
  api: { task: { useUnlockTask: vi.fn() } },
}))

type UnlockMutate = ReturnType<typeof api.task.useUnlockTask>['mutate']

const mockUnlock = (mutate: UnlockMutate = vi.fn((_id, opts) => opts?.onSuccess?.())) => {
  vi.mocked(api.task.useUnlockTask).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof api.task.useUnlockTask>)
  return mutate
}

const makeLockConflictError = (body: Record<string, unknown>) => {
  const response = new Response(JSON.stringify(body), { status: 409 })
  const request = new Request('http://example.test/api/v2/task/1/start')
  return new HTTPError(response, request, {} as NormalizedOptions)
}

describe('useLockConflict', () => {
  it('starts with no conflict', () => {
    mockUnlock()
    const { result } = renderHook(() => useLockConflict())

    expect(result.current.conflict).toBeNull()
  })

  it('handleError returns false and leaves conflict unset for a non-lock error', async () => {
    mockUnlock()
    const { result } = renderHook(() => useLockConflict())
    const retry = vi.fn()

    let handled = true
    await act(async () => {
      handled = await result.current.handleError(new Error('boom'), retry)
    })

    expect(handled).toBe(false)
    expect(result.current.conflict).toBeNull()
    expect(retry).not.toHaveBeenCalled()
  })

  it('handleError stores the conflict details for a 409 lock conflict', async () => {
    mockUnlock()
    const { result } = renderHook(() => useLockConflict())
    const error = makeLockConflictError({
      lockedTaskId: 42,
      parentName: 'My Challenge',
      bundledTasks: [43],
    })

    let handled = false
    await act(async () => {
      handled = await result.current.handleError(error, vi.fn())
    })

    expect(handled).toBe(true)
    expect(result.current.conflict).toEqual({
      lockedTaskId: 42,
      parentName: 'My Challenge',
      bundledTasks: [43],
      startedAt: undefined,
    })
  })

  it('confirm releases the held lock and retries the original action', async () => {
    const mutate = mockUnlock()
    const { result } = renderHook(() => useLockConflict())
    const retry = vi.fn()
    const error = makeLockConflictError({ lockedTaskId: 99, bundledTasks: [] })

    await act(async () => {
      await result.current.handleError(error, retry)
    })
    expect(result.current.conflict?.lockedTaskId).toBe(99)

    act(() => {
      result.current.confirm()
    })

    expect(mutate).toHaveBeenCalledWith(
      99,
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
    expect(retry).toHaveBeenCalledTimes(1)
    expect(result.current.conflict).toBeNull()
  })

  it('confirm does nothing when there is no active conflict', () => {
    const mutate = mockUnlock()
    const { result } = renderHook(() => useLockConflict())

    act(() => {
      result.current.confirm()
    })

    expect(mutate).not.toHaveBeenCalled()
  })

  it('cancel clears the conflict without releasing anything', async () => {
    const mutate = mockUnlock()
    const { result } = renderHook(() => useLockConflict())
    const retry = vi.fn()
    const error = makeLockConflictError({ lockedTaskId: 7, bundledTasks: [] })

    await act(async () => {
      await result.current.handleError(error, retry)
    })

    act(() => {
      result.current.cancel()
    })

    expect(result.current.conflict).toBeNull()
    expect(mutate).not.toHaveBeenCalled()

    // Confirming after a cancel must not resurrect the stale retry.
    act(() => {
      result.current.confirm()
    })
    expect(retry).not.toHaveBeenCalled()
  })
})
