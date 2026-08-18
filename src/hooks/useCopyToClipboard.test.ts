// @vitest-environment happy-dom
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from '@/lib/logger'
import { renderHook } from '@/test/renderHook'
import { useCopyToClipboard } from './useCopyToClipboard'

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn() },
}))

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.mocked(logger.warn).mockClear()
  })

  it('starts with isCopied false', () => {
    const { result } = renderHook(() => useCopyToClipboard())

    expect(result.current.isCopied).toBe(false)
  })

  it('warns and does nothing when clipboard is unsupported', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('hello')
    })

    expect(logger.warn).toHaveBeenCalledWith('Clipboard not supported')
    expect(result.current.isCopied).toBe(false)
  })

  it('sets isCopied true on success then false after the timeout', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('hello world')
    })

    expect(writeText).toHaveBeenCalledWith('hello world')
    expect(result.current.isCopied).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.isCopied).toBe(false)
  })

  it('clears the pending reset timeout from an earlier call before scheduling a new one', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('first')
    })
    expect(result.current.isCopied).toBe(true)

    // Advance partway through the first call's 2000ms reset timeout, then
    // copy again — this should clear the first timeout rather than letting
    // it flip isCopied back to false out from under the second call.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    await act(async () => {
      await result.current.copy('second')
    })
    expect(result.current.isCopied).toBe(true)

    // The first call's timeout would have fired here if it hadn't been
    // cleared; isCopied must still be true.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(result.current.isCopied).toBe(true)

    // The second call's own timeout fires 2000ms after it ran.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(result.current.isCopied).toBe(false)
  })

  it('warns and sets isCopied false when the clipboard write rejects', async () => {
    const error = new Error('denied')
    const writeText = vi.fn().mockRejectedValue(error)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('hello')
    })

    expect(logger.warn).toHaveBeenCalledWith('Copy failed', { error })
    expect(result.current.isCopied).toBe(false)
  })
})
