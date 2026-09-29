/**
 * @vitest-environment happy-dom
 */
import { act, createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'

const state = vi.hoisted(() => ({
  isLocked: false,
  lockedTasks: [] as number[],
  selectedMarker: null as null | {
    id: number
    status: number
    bundleId: number | null
    lockedBy: number | null
  },
  lockBundle: vi.fn(),
}))

vi.mock('@/api', () => ({
  api: {
    task: {
      useLockTaskBundle: () => ({ mutateAsync: state.lockBundle, mutate: state.lockBundle }),
      getTask: () => ({ data: null }),
    },
    taskBundle: { getTaskBundle: () => ({ data: null }) },
  },
}))
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: () => ({ user: { id: 7 } }) }))
vi.mock('@/i18n', () => ({ useIntl: () => ({ t: (_k: string, _v: unknown, d: string) => d }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/components/Pages/TaskEditPage/contexts/TaskContext', () => ({
  useTaskContext: () => ({
    task: { id: 1, bundleId: null, status: 0, location: { coordinates: [0, 0] } },
    isLocked: state.isLocked,
    lockedTasks: state.lockedTasks,
  }),
}))
vi.mock('@/components/Pages/TaskEditPage/contexts/TaskMapContext', () => ({
  MAX_SELECTED_TASKS: 50,
  useTaskMapContext: () => ({
    selectedMarker: state.selectedMarker,
    setSelectedMarker: vi.fn(),
    setActiveTaskId: vi.fn(),
    emptyClickCount: 0,
  }),
}))
vi.mock('@/hooks/useDrawerTransition', () => ({ useDrawerTransition: () => false }))

const { TaskBundleProvider, useTaskBundleContext } = await import('./TaskBundleContext')

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(TaskBundleProvider, null, children)

describe('TaskBundleContext bundling requires a lock', () => {
  beforeEach(() => {
    state.isLocked = false
    state.lockedTasks = []
    state.selectedMarker = { id: 2, status: 0, bundleId: null, lockedBy: null }
    state.lockBundle.mockReset()
    state.lockBundle.mockResolvedValue({})
  })

  it('offers nothing and adds nothing while the primary task is unlocked', async () => {
    const { result } = renderHook(() => useTaskBundleContext(), { wrapper })

    expect(result.current.canAddSelectedMarkerToBundle).toBe(false)

    await act(async () => {
      await result.current.handleAddToBundle()
    })

    expect(state.lockBundle).not.toHaveBeenCalled()
    expect(result.current.activeBundle).toBeNull()
  })

  it('adds a task only after the lock covering it succeeds', async () => {
    state.isLocked = true
    const { result } = renderHook(() => useTaskBundleContext(), { wrapper })

    expect(result.current.canAddSelectedMarkerToBundle).toBe(true)

    await act(async () => {
      await result.current.handleAddToBundle()
    })

    expect(state.lockBundle).toHaveBeenCalledWith({ taskId: 1, taskIds: [2] })
    expect(result.current.activeBundle?.taskIds).toEqual([1, 2])
  })

  it('leaves the bundle untouched when the lock fails', async () => {
    state.isLocked = true
    state.lockBundle.mockRejectedValue(new Error('locked by someone else'))
    const { result } = renderHook(() => useTaskBundleContext(), { wrapper })

    await act(async () => {
      await result.current.handleAddToBundle()
    })

    expect(state.lockBundle).toHaveBeenCalled()
    expect(result.current.activeBundle).toBeNull()
  })
})
