import { useCallback, useEffect, useRef, useState } from 'react'

export interface PanelPosition {
  /** Distance from the left edge of the viewport, in pixels. */
  x: number
  /** Distance from the top edge of the viewport, in pixels. */
  y: number
}

const MARGIN = 12

const readStored = (storageKey: string): PanelPosition | null => {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.x === 'number' && typeof parsed?.y === 'number' ? parsed : null
  } catch {
    return null
  }
}

/** Keep a panel fully on screen, so it can't be dragged (or resized) out of reach. */
const clampToViewport = (position: PanelPosition, size: PanelPosition): PanelPosition => ({
  x: Math.min(Math.max(position.x, MARGIN), Math.max(MARGIN, window.innerWidth - size.x - MARGIN)),
  y: Math.min(Math.max(position.y, MARGIN), Math.max(MARGIN, window.innerHeight - size.y - MARGIN)),
})

/**
 * Makes a panel draggable anywhere in the viewport, remembering where the user
 * put it. Until they move it, the panel sits at the bottom right.
 *
 * Returns a ref for the panel, the handle props to spread onto whatever should
 * start a drag, and the position to apply.
 */
export const useDraggablePanel = (storageKey: string) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<PanelPosition | null>(() => readStored(storageKey))
  const [dragging, setDragging] = useState(false)
  // Where in the panel the pointer grabbed it, so it doesn't jump on grab.
  const grabOffset = useRef<PanelPosition>({ x: 0, y: 0 })

  // Place the panel at the bottom right on first render, once its size is
  // known. Measuring beats hardcoding: the panel's width changes as its
  // contents collapse.
  useEffect(() => {
    if (position !== null) return
    const element = panelRef.current
    if (!element) return
    const { width, height } = element.getBoundingClientRect()
    setPosition({
      x: Math.max(MARGIN, window.innerWidth - width - MARGIN),
      y: Math.max(MARGIN, window.innerHeight - height - MARGIN),
    })
  }, [position])

  // A panel parked near an edge would otherwise end up off screen when the
  // window shrinks — or when the panel itself grows, which it does when its
  // contents are expanded. A ResizeObserver covers both without the panel
  // having to tell us it changed shape.
  useEffect(() => {
    const element = panelRef.current
    if (!element) return

    const reclamp = () => {
      const { width, height } = element.getBoundingClientRect()
      setPosition((current) =>
        current ? clampToViewport(current, { x: width, y: height }) : current
      )
    }

    const observer = new ResizeObserver(reclamp)
    observer.observe(element)
    window.addEventListener('resize', reclamp)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', reclamp)
    }
  }, [])

  useEffect(() => {
    if (!dragging) return

    const onPointerMove = (event: PointerEvent) => {
      const element = panelRef.current
      const size = element ? { x: element.offsetWidth, y: element.offsetHeight } : { x: 0, y: 0 }
      setPosition(
        clampToViewport(
          { x: event.clientX - grabOffset.current.x, y: event.clientY - grabOffset.current.y },
          size
        )
      )
    }
    const onPointerUp = () => setDragging(false)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [dragging])

  // Persist only once the drag ends, to avoid a write per pointer move.
  useEffect(() => {
    if (dragging || !position) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(position))
    } catch {
      // A private window may refuse to store; the panel still works this session.
    }
  }, [dragging, position, storageKey])

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    // Let clicks on the panel's own buttons through untouched.
    if ((event.target as HTMLElement).closest('button, a, input, select')) return
    const element = panelRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    grabOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    setDragging(true)
    event.preventDefault()
  }, [])

  return {
    panelRef,
    dragging,
    /** Spread onto the drag handle. */
    handleProps: { onPointerDown },
    /** Spread onto the panel. Hidden until measured, to avoid a visible jump. */
    style: position
      ? { left: position.x, top: position.y }
      : { left: 0, top: 0, visibility: 'hidden' as const },
  }
}
