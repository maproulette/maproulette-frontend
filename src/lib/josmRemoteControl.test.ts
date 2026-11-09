import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  josmLoadObjectsUrl,
  josmZoomUrl,
  sendJosmCommand,
  sendJosmCommands,
  viewportToBbox,
} from './josmRemoteControl'

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

describe('josm short-code commands', () => {
  it('loads objects into the current layer or a new one', () => {
    expect(josmLoadObjectsUrl(['n1', 'w2'], false)).toBe(
      'http://127.0.0.1:8111/load_object?objects=n1,w2&layer_name=n1,w2'
    )
    expect(josmLoadObjectsUrl(['r3'], true)).toBe(
      'http://127.0.0.1:8111/load_object?objects=r3&layer_name=r3&new_layer=true'
    )
  })

  it('zooms to a bounding box', () => {
    expect(josmZoomUrl([1, 2, 3, 4])).toBe(
      'http://127.0.0.1:8111/zoom?left=1&bottom=2&right=3&top=4'
    )
  })

  it('turns a viewport into the box a window of that size would show', () => {
    const [west, south, east, north] = viewportToBbox(1, 0, 0, 512, 512)
    expect(west).toBeCloseTo(-180)
    expect(east).toBeCloseTo(180)
    expect(south).toBeCloseTo(-85.0511, 3)
    expect(north).toBeCloseTo(85.0511, 3)

    const [w, s, e, n] = viewportToBbox(17, 37.11777, 126.99754, 800, 600)
    expect((w + e) / 2).toBeCloseTo(126.99754, 5)
    expect(s).toBeLessThan(37.11777)
    expect(n).toBeGreaterThan(37.11777)
    expect(e - w).toBeCloseTo((800 / (256 * 2 ** 17)) * 360, 8)
  })
})
