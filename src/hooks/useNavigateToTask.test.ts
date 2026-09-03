// @vitest-environment happy-dom
import { useNavigate } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { useNavigateToTask } from './useNavigateToTask'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}))

const navigate = vi.fn()
vi.mocked(useNavigate).mockReturnValue(navigate as unknown as ReturnType<typeof useNavigate>)

afterEach(() => {
  navigate.mockClear()
})

describe('useNavigateToTask', () => {
  it('claims the task by default so TaskContext locks it on arrival', () => {
    const { result } = renderHook(() => useNavigateToTask())
    result.current(42)
    expect(navigate).toHaveBeenCalledWith({
      to: '/tasks/$taskId',
      params: { taskId: '42' },
      search: { claimTask: true },
    })
  })

  it('accepts a string task id', () => {
    const { result } = renderHook(() => useNavigateToTask())
    result.current('42')
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ params: { taskId: '42' } }))
  })

  it('skips the claim for a read-only visit', () => {
    const { result } = renderHook(() => useNavigateToTask())
    result.current(42, { claim: false })
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ search: undefined }))
  })

  it('returns whatever navigate returns so callers can await it', () => {
    navigate.mockReturnValue('navigating')
    const { result } = renderHook(() => useNavigateToTask())
    expect(result.current(1)).toBe('navigating')
  })
})
