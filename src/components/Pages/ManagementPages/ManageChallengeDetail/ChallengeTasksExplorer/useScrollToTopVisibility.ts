import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tracks whether a top-of-page sentinel has scrolled out of view, and
 * provides a helper to smoothly scroll it back into view.
 */
export const useScrollToTopVisibility = () => {
  const topRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const top = topRef.current
    if (!top) return

    const observer = new IntersectionObserver(
      (entries) => {
        setShowScrollTop(!entries[0]?.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(top)
    return () => observer.disconnect()
  }, [])

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return { topRef, showScrollTop, scrollToTop }
}
