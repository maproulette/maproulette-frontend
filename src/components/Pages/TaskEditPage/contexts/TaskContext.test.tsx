/**
 * @vitest-environment happy-dom
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { HTTPError, type NormalizedOptions } from 'ky'
import { act, createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import type { TaskGetResponse } from '@/types/Task'

const USER_ID = 7
const TASK_ID = 1

const state = vi.hoisted(() => ({
  task: null as unknown as TaskGetResponse,
  claimTask: undefined as boolean | undefined,
  lock: vi.fn(),
  refresh: vi.fn(),
  lockFailure: undefined as unknown,
}))

vi.mock('@tanstack/react-router', () => ({
  useLoaderData: () => ({ task: state.task, challenge: { paused: false } }),
  useSearch: () => ({ claimTask: state.claimTask }),
  useNavigate: () => vi.fn(),
}))
vi.mock('@/api/task', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/task')>()),
  useLockTask: () => ({ mutateAsync: state.lock, isPending: false }),
  useUnlockTask: () => ({ mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false }),
  useRefreshLock: () => ({ mutate: state.refresh }),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: { id: USER_ID }, isAuthenticated: true }),
}))
vi.mock('@/contexts/PluginContext', () => ({
  usePluginContext: () => ({ isTaskEditableByPlugins: () => false }),
}))
vi.mock('@/i18n', async () => {
  const { testT } = await import('@/test/translate')
  return { useIntl: () => ({ t: testT }) }
})
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('./LockConflictDialog', () => ({ LockConflictDialog: () => null }))
vi.mock('./LockFailedDialog', () => ({
  LockFailedDialog: ({ failure }: { failure: unknown }) => {
    state.lockFailure = failure
    return null
  },
}))

const { TaskProvider, useTaskContext } = await import('./TaskContext')
const { taskKeys } = await import('@/api/task')

const queryClient = createTestQueryClient()
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(TaskProvider, null, children)
  )

const mount = () => {
  queryClient.setQueryData(taskKeys.task(TASK_ID), state.task)
  return renderHook(() => useTaskContext(), { wrapper })
}

const task = (overrides: Partial<TaskGetResponse> = {}) =>
  ({ id: TASK_ID, parent: 10, status: 0, lockedBy: null, ...overrides }) as TaskGetResponse

describe('TaskContext locks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    state.claimTask = undefined
    state.lock.mockReset()
    state.lock.mockResolvedValue({})
    state.refresh.mockReset()
    state.lockFailure = undefined
    queryClient.clear()
    vi.stubGlobal('fetch', () => new Promise(() => {}))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('reads the lock from the task it holds', () => {
    state.task = task({ lockedBy: USER_ID, lockBundledTasks: [TASK_ID, 2, 3] })
    const { result } = mount()

    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockedTasks).toEqual([2, 3])
  })

  it('treats a lock held by somebody else as not held', () => {
    state.task = task({ lockedBy: 99, lockBundledTasks: [TASK_ID, 2] })
    const { result } = mount()

    expect(result.current.isLocked).toBe(false)
    expect(result.current.lockedTasks).toEqual([])
  })

  it('keeps a lock it found on load alive', () => {
    state.task = task({ lockedBy: USER_ID })
    mount()

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(state.refresh).toHaveBeenCalledWith(TASK_ID, expect.anything())
  })

  it('reports a lock that could not be refreshed', async () => {
    state.task = task({ lockedBy: USER_ID })
    state.refresh.mockImplementation(
      (_taskId: number, { onError }: { onError: (error: unknown) => Promise<void> }) =>
        onError(new Error('lock lost'))
    )
    mount()

    await act(async () => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(state.lockFailure).toEqual({ message: undefined, lockedByAnotherUser: false })
  })

  it('reports a task it could not claim', async () => {
    state.claimTask = true
    state.task = task()
    state.lock.mockRejectedValue(new Error('network down'))
    mount()

    await act(async () => {})

    expect(state.lockFailure).toEqual({ message: undefined, lockedByAnotherUser: false })
  })

  it('reports a task somebody else holds as locked by another user', async () => {
    state.claimTask = true
    state.task = task()
    state.lock.mockRejectedValue(
      new HTTPError(
        new Response(
          JSON.stringify({ status: 'Forbidden', message: 'Task is currently locked by user x' }),
          { status: 403 }
        ),
        new Request('http://example.test/api/v2/task/1/start'),
        {} as NormalizedOptions
      )
    )
    mount()

    await act(async () => {})

    expect(state.lockFailure).toEqual({
      message: 'Task is currently locked by user x',
      lockedByAnotherUser: true,
    })
  })

  it('does not refresh a lock it does not hold', () => {
    state.task = task()
    mount()

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(state.refresh).not.toHaveBeenCalled()
  })

  it('does not claim a task it already holds', () => {
    state.claimTask = true
    state.task = task({ lockedBy: USER_ID })
    mount()

    expect(state.lock).not.toHaveBeenCalled()
  })

  it('claims a free task when asked to', () => {
    state.claimTask = true
    state.task = task()
    mount()

    expect(state.lock).toHaveBeenCalledWith(TASK_ID)
  })
})
