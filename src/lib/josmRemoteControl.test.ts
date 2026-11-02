import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendJosmCommand, sendJosmCommands } from './josmRemoteControl'

describe('josmRemoteControl', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('reports whether JOSM answered a command', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('OK', { status: 200 })))
    expect(await sendJosmCommand('http://127.0.0.1:8111/version')).toBe(true)

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect(await sendJosmCommand('http://127.0.0.1:8111/version')).toBe(false)
  })

  it('sends commands one at a time, a second apart', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const sent = sendJosmCommands(['http://josm/a', 'http://josm/b'])
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1000)
    expect(await sent).toBe(true)
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://josm/a', 'http://josm/b'])
  })

  it('stops when JOSM does not answer the first command', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    expect(await sendJosmCommands(['http://josm/a', 'http://josm/b'])).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('still reports success when only a follow-up command fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('OK', { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    const sent = sendJosmCommands(['http://josm/a', 'http://josm/b'])
    await vi.advanceTimersByTimeAsync(1000)
    expect(await sent).toBe(true)
  })
})
