// @vitest-environment happy-dom
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('roads'))

    expect(result.current).toBe('roads')
  })

  it('only takes the latest value once it stops changing', () => {
    let value = 'r'
    const { result, rerender } = renderHook(() => useDebouncedValue(value))

    value = 'ro'
    rerender()
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1)
    })
    value = 'roa'
    rerender()
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1)
    })
    expect(result.current).toBe('r')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('roa')
  })
})
