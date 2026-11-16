// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { useShareSupport } from './useShareSupport'

describe('useShareSupport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when navigator.share is available', () => {
    vi.stubGlobal('navigator', { ...navigator, share: vi.fn() })

    const { result } = renderHook(() => useShareSupport())

    expect(result.current).toBe(true)
  })

  it('returns false when navigator.share is not a function', () => {
    const { share: _share, ...navigatorWithoutShare } = navigator as Navigator & {
      share?: unknown
    }
    vi.stubGlobal('navigator', navigatorWithoutShare)

    const { result } = renderHook(() => useShareSupport())

    expect(result.current).toBe(false)
  })

  it('unsubscribes on unmount without throwing', () => {
    const { unmount } = renderHook(() => useShareSupport())

    expect(() => unmount()).not.toThrow()
  })
})
