/**
 * @vitest-environment happy-dom
 */
import { QueryClientProvider } from '@tanstack/react-query'
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
}))

vi.mock('@tanstack/react-router', () => ({
  useLoaderData: () => ({ task: state.task, challenge: { paused: false } }),
  useSearch: () => ({ claimTask: state.claimTask }),
  useNavigate: () => vi.fn(),
}))
vi.mock('@/api', () => ({
  api: {
    task: {
      getTask: () => ({ data: state.task }),
      useLockTask: () => ({ mutateAsync: state.lock, isPending: false }),
      useUnlockTask: () => ({ mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false }),
      useRefreshLock: () => ({ mutate: state.refresh }),
    },
  },
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: { id: USER_ID }, isAuthenticated: true }),
}))
vi.mock('@/contexts/PluginContext', () => ({
  usePluginContext: () => ({ isTaskEditableByPlugins: () => false }),
}))
vi.mock('@/i18n', () => ({ useIntl: () => ({ t: (_k: string, _v: unknown, d: string) => d }) }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('./LockConflictDialog', () => ({ LockConflictDialog: () => null }))

const { TaskProvider, useTaskContext } = await import('./TaskContext')

const queryClient = createTestQueryClient()
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(TaskProvider, null, children)
  )

const task = (overrides: Partial<TaskGetResponse> = {}) =>
  ({ id: TASK_ID, parent: 10, status: 0, lockedBy: null, ...overrides }) as TaskGetResponse

describe('TaskContext locks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    state.claimTask = undefined
    state.lock.mockReset()
    state.lock.mockResolvedValue({})
    state.refresh.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the lock from the task it holds', () => {
    state.task = task({ lockedBy: USER_ID, lockBundledTasks: [TASK_ID, 2, 3] })
    const { result } = renderHook(() => useTaskContext(), { wrapper })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockedTasks).toEqual([2, 3])
  })

  it('treats a lock held by somebody else as not held', () => {
    state.task = task({ lockedBy: 99, lockBundledTasks: [TASK_ID, 2] })
    const { result } = renderHook(() => useTaskContext(), { wrapper })

    expect(result.current.isLocked).toBe(false)
    expect(result.current.lockedTasks).toEqual([])
  })

  it('keeps a lock it found on load alive', () => {
    state.task = task({ lockedBy: USER_ID })
    renderHook(() => useTaskContext(), { wrapper })

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(state.refresh).toHaveBeenCalledWith(TASK_ID, expect.anything())
  })

  it('does not refresh a lock it does not hold', () => {
    state.task = task()
    renderHook(() => useTaskContext(), { wrapper })

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(state.refresh).not.toHaveBeenCalled()
  })

  it('does not claim a task it already holds', () => {
    state.claimTask = true
    state.task = task({ lockedBy: USER_ID })
    renderHook(() => useTaskContext(), { wrapper })

    expect(state.lock).not.toHaveBeenCalled()
  })

  it('claims a free task when asked to', () => {
    state.claimTask = true
    state.task = task()
    renderHook(() => useTaskContext(), { wrapper })

    expect(state.lock).toHaveBeenCalledWith(TASK_ID)
  })
})
