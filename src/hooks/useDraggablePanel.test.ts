/**
 * @vitest-environment happy-dom
 */
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import { useDraggablePanel } from './useDraggablePanel.ts'

const KEY = 'mr4:test:panel'

// happy-dom has no ResizeObserver.
class NoopResizeObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('ResizeObserver', NoopResizeObserver)
  vi.stubGlobal('innerWidth', 1000)
  vi.stubGlobal('innerHeight', 800)
})

afterEach(() => {
  vi.unstubAllGlobals()
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
      } as unknown as React.PointerEvent)
    })

    expect(result.current.dragging).toBe(false)
    button.remove()
  })
})
