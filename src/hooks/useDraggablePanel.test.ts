/**
 * @vitest-environment happy-dom
 */
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { type PanelPosition, useDraggablePanel } from './useDraggablePanel.ts'

const KEY = 'mr4:test:panel'

// happy-dom has no ResizeObserver; this stand-in also hands the observation
// callback back to the test so a panel resize can be simulated.
let observations: Array<() => void> = []
let disconnects = 0
class FakeResizeObserver {
  constructor(callback: () => void) {
    observations.push(callback)
  }
  observe() {}
  disconnect() {
    disconnects += 1
  }
}

/**
 * A stand-in for the panel element. The hook measures it with
 * getBoundingClientRect and reads offsetWidth/Height mid-drag, neither of which
 * happy-dom computes for an unstyled node.
 */
const makePanel = (width = 200, height = 100) => {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ width, height, left: 40, top: 60 }) as DOMRect
  Object.defineProperty(element, 'offsetWidth', { configurable: true, value: width })
  Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height })
  document.body.appendChild(element)
  return element
}

/**
 * Renders the hook with the panel already attached to its ref, the way React
 * attaches a `ref` prop before effects run.
 */
const renderWithPanel = (
  element: HTMLElement,
  defaultPosition?: (size: PanelPosition) => PanelPosition
) =>
  renderHook(() => {
    const panel = useDraggablePanel(KEY, defaultPosition)
    panel.panelRef.current = element as HTMLDivElement
    return panel
  })

const pointerEvent = (overrides: Record<string, unknown> = {}) =>
  ({
    target: document.body,
    currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    preventDefault: () => {},
    ...overrides,
  }) as unknown as React.PointerEvent<HTMLElement>

beforeEach(() => {
  localStorage.clear()
  observations = []
  disconnects = 0
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  vi.stubGlobal('innerWidth', 1000)
  vi.stubGlobal('innerHeight', 800)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('useDraggablePanel', () => {
  it('starts hidden until it has been measured, so it does not visibly jump', () => {
    const { result } = renderHook(() => useDraggablePanel(KEY))
    expect(result.current.style).toMatchObject({ visibility: 'hidden' })
  })

  it('restores a remembered position instead of measuring again', () => {
    localStorage.setItem(KEY, JSON.stringify({ x: 120, y: 240 }))
    const { result } = renderHook(() => useDraggablePanel(KEY))
    expect(result.current.style).toEqual({ left: 120, top: 240 })
  })

  it('ignores unusable stored values', () => {
    for (const stored of ['not json', '{"x":"a","y":2}', 'null']) {
      localStorage.setItem(KEY, stored)
      const { result } = renderHook(() => useDraggablePanel(KEY))
      expect(result.current.style).toMatchObject({ visibility: 'hidden' })
    }
  })

  it('does not begin a drag from a click on one of the panel’s buttons', () => {
    const { result } = renderHook(() => useDraggablePanel(KEY))
    const button = document.createElement('button')
    document.body.appendChild(button)

    act(() => {
      result.current.handleProps.onPointerDown({
        target: button,
        clientX: 0,
        clientY: 0,
        preventDefault: () => {},
      } as unknown as React.PointerEvent<HTMLElement>)
    })

    expect(result.current.dragging).toBe(false)
    button.remove()
  })

  it('parks a freshly measured panel in the bottom right', () => {
    const { result } = renderWithPanel(makePanel(200, 100))

    expect(result.current.style).toEqual({ left: 788, top: 688 })
  })

  it('remembers where the panel ended up', () => {
    renderWithPanel(makePanel(200, 100))

    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual({ x: 788, y: 688 })
  })

  it('honours a caller-supplied resting place, clamped into the viewport', () => {
    const { result } = renderWithPanel(makePanel(200, 100), () => ({ x: -50, y: 5000 }))

    expect(result.current.style).toEqual({ left: 12, top: 688 })
  })

  it('pulls the panel back on screen when the window shrinks', () => {
    const { result } = renderWithPanel(makePanel(200, 100))
    vi.stubGlobal('innerWidth', 400)
    vi.stubGlobal('innerHeight', 300)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.style).toEqual({ left: 188, top: 188 })
  })

  it('pulls the panel back on screen when the panel itself grows', () => {
    const { result } = renderWithPanel(makePanel(200, 100))
    vi.stubGlobal('innerWidth', 400)

    act(() => {
      for (const observation of observations) observation()
    })

    expect(result.current.style).toMatchObject({ left: 188 })
  })

  it('stops observing once the panel goes away', () => {
    const { unmount } = renderWithPanel(makePanel(200, 100))

    unmount()

    expect(disconnects).toBe(1)
  })

  it('drags the panel, keeping the grab point under the pointer', () => {
    const { result } = renderWithPanel(makePanel(200, 100))
    const capture = vi.fn()

    act(() => {
      result.current.handleProps.onPointerDown(
        pointerEvent({
          clientX: 100,
          clientY: 80,
          currentTarget: { setPointerCapture: capture, releasePointerCapture: vi.fn() },
        })
      )
    })
    expect(result.current.dragging).toBe(true)
    expect(capture).toHaveBeenCalledWith(1)

    act(() => {
      result.current.handleProps.onPointerMove(pointerEvent({ clientX: 300, clientY: 400 }))
    })

    // Grabbed 60px right of and 20px below the panel's top-left corner.
    expect(result.current.style).toEqual({ left: 240, top: 380 })
  })

  it('drags on even when the browser refuses pointer capture', () => {
    const { result } = renderWithPanel(makePanel(200, 100))

    act(() => {
      result.current.handleProps.onPointerDown(
        pointerEvent({
          currentTarget: {
            setPointerCapture: () => {
              throw new Error('no capture here')
            },
          },
        })
      )
    })

    expect(result.current.dragging).toBe(true)
  })

  it('ignores a pointer move that is not part of a drag', () => {
    const { result } = renderWithPanel(makePanel(200, 100))
    const before = result.current.style

    act(() => {
      result.current.handleProps.onPointerMove(pointerEvent({ clientX: 300, clientY: 400 }))
    })

    expect(result.current.style).toEqual(before)
  })

  it('treats a panel that has gone away mid-drag as having no size', () => {
    const { result } = renderWithPanel(makePanel(200, 100))

    act(() => {
      result.current.handleProps.onPointerDown(pointerEvent({ clientX: 100, clientY: 80 }))
    })
    act(() => {
      result.current.panelRef.current = null
      result.current.handleProps.onPointerMove(pointerEvent({ clientX: 5000, clientY: 5000 }))
    })

    // With no measurable size the panel can go right up to the far margin.
    expect(result.current.style).toEqual({ left: 988, top: 788 })
  })

  it('ends the drag and releases the pointer on pointer up', () => {
    const { result } = renderWithPanel(makePanel(200, 100))
    const release = vi.fn()

    act(() => {
      result.current.handleProps.onPointerDown(pointerEvent())
    })
    act(() => {
      result.current.handleProps.onPointerUp(
        pointerEvent({ currentTarget: { releasePointerCapture: release } })
      )
    })

    expect(result.current.dragging).toBe(false)
    expect(release).toHaveBeenCalledWith(1)
  })

  it('ends the drag even if the pointer was never captured', () => {
    const { result } = renderWithPanel(makePanel(200, 100))

    act(() => {
      result.current.handleProps.onPointerDown(pointerEvent())
    })
    act(() => {
      result.current.handleProps.onPointerCancel(
        pointerEvent({
          currentTarget: {
            releasePointerCapture: () => {
              throw new Error('never captured')
            },
          },
        })
      )
    })

    expect(result.current.dragging).toBe(false)
  })

  it('does not start a drag once the panel has gone away', () => {
    const { result } = renderHook(() => useDraggablePanel(KEY))

    act(() => {
      result.current.handleProps.onPointerDown(pointerEvent())
    })

    expect(result.current.dragging).toBe(false)
  })
})
