// @vitest-environment happy-dom
import { act, createRef } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { useWebGLContextRecovery } from './useWebGLContextRecovery'

/** Stand-in for the bits of the MapLibre map the hook touches. */
const fakeMapRef = (canvas: HTMLCanvasElement, style: object | null) => {
  const map = { getCanvas: () => canvas, style }
  return { getMap: () => map } as unknown as MapRef
}

describe('useWebGLContextRecovery', () => {
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    vi.useFakeTimers()
    canvas = document.createElement('canvas')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const setup = (style: object | null) => {
    const ref = createRef<MapRef>() as React.RefObject<MapRef | null>
    const setMapLoaded = vi.fn()
    const view = renderHook(() => useWebGLContextRecovery(ref, setMapLoaded))
    act(() => {
      view.result.current.attachMap(fakeMapRef(canvas, style))
    })
    return { ...view, ref, setMapLoaded }
  }

  const loseContext = () => {
    act(() => {
      canvas.dispatchEvent(new Event('webglcontextlost'))
      vi.advanceTimersByTime(600)
    })
  }

  const tickWatchdog = () => {
    act(() => {
      vi.advanceTimersByTime(1100)
    })
  }

  it('forwards the map instance to the caller ref', () => {
    const { ref } = setup({ imageManager: {} })
    expect(ref.current?.getMap().style).toEqual({ imageManager: {} })
  })

  it('remounts the map when MapLibre is left without a style', () => {
    const { result, setMapLoaded } = setup(null)

    loseContext()

    expect(result.current.mapKey).toBe(1)
    expect(setMapLoaded).toHaveBeenCalledWith(false)
  })

  it('remounts a map that died before we ever saw the loss event', () => {
    // The context can be taken away before onLoad fires or React hands over
    // the instance, so no `webglcontextlost` listener was in place to catch it.
    const { result } = setup(null)

    tickWatchdog()

    expect(result.current.mapKey).toBe(1)
  })

  it('leaves the map alone when MapLibre recovers on its own', () => {
    const { result, setMapLoaded } = setup({ imageManager: {} })

    loseContext()
    tickWatchdog()

    expect(result.current.mapKey).toBe(0)
    expect(setMapLoaded).not.toHaveBeenCalled()
  })

  it('gives up after repeated failures instead of remounting forever', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = setup(null)

    for (let attempt = 0; attempt < 5; attempt++) {
      act(() => {
        result.current.attachMap(fakeMapRef(canvas, null))
      })
      tickWatchdog()
    }

    expect(result.current.mapKey).toBe(3)
    expect(warn).toHaveBeenCalled()
  })

  it('stops watching once the map is detached', () => {
    const { result } = setup(null)

    act(() => {
      result.current.attachMap(null)
    })
    tickWatchdog()

    expect(result.current.mapKey).toBe(0)
  })

  it('stops watching on unmount', () => {
    const { result, unmount } = setup(null)
    const before = result.current.mapKey

    unmount()
    loseContext()
    tickWatchdog()

    expect(result.current.mapKey).toBe(before)
  })
})
