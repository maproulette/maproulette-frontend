// @vitest-environment happy-dom
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { useDrawerTransition } from './useDrawerTransition'

interface Props {
  shouldBeOpen: boolean
  target: number
  duration?: number
}

const setup = (initialProps: Props) =>
  renderHook(
    (props: Props) => useDrawerTransition(props.shouldBeOpen, props.target, props.duration),
    { initialProps }
  )

describe('useDrawerTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays closed while shouldBeOpen is false, then opens once it becomes true', () => {
    const { result, rerender } = setup({ shouldBeOpen: false, target: 1 })
    expect(result.current).toBe(false)

    act(() => {
      rerender({ shouldBeOpen: true, target: 1 })
    })
    expect(result.current).toBe(true)
  })

  it('opens immediately on mount when shouldBeOpen starts true', () => {
    const { result } = setup({ shouldBeOpen: true, target: 1 })
    expect(result.current).toBe(true)
  })

  it('closes immediately when shouldBeOpen becomes false while open', () => {
    const { result, rerender } = setup({ shouldBeOpen: true, target: 1 })
    expect(result.current).toBe(true)

    act(() => {
      rerender({ shouldBeOpen: false, target: 1 })
    })
    expect(result.current).toBe(false)
  })

  it('slides out then reopens after the default duration when target changes while open', async () => {
    const { result, rerender } = setup({ shouldBeOpen: true, target: 1 })
    expect(result.current).toBe(true)

    act(() => {
      rerender({ shouldBeOpen: true, target: 2 })
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(319)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current).toBe(true)
  })

  it('respects a custom duration for the slide-out timing', async () => {
    const { result, rerender } = setup({ shouldBeOpen: true, target: 1, duration: 1000 })
    expect(result.current).toBe(true)

    act(() => {
      rerender({ shouldBeOpen: true, target: 2, duration: 1000 })
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(result.current).toBe(true)
  })

  it('is a no-op when an unrelated prop changes while already open and the target is unchanged', () => {
    const { result, rerender } = setup({ shouldBeOpen: true, target: 1, duration: 1000 })
    expect(result.current).toBe(true)

    act(() => {
      rerender({ shouldBeOpen: true, target: 1, duration: 500 })
    })
    expect(result.current).toBe(true)
  })

  it('clears the pending reopen timer on unmount while sliding out', async () => {
    const { result, rerender, unmount } = setup({ shouldBeOpen: true, target: 1 })
    expect(result.current).toBe(true)

    act(() => {
      rerender({ shouldBeOpen: true, target: 2 })
    })
    expect(result.current).toBe(false)

    expect(() => {
      act(() => {
        unmount()
      })
    }).not.toThrow()

    // The cleared timer must not fire after unmount.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(320)
    })
  })
})
