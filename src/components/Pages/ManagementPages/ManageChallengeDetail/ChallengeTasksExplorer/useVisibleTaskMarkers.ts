import { useEffect, useRef, useState } from 'react'
import type { TaskMarker } from '@/types/Task'
import { BATCH_SIZE } from './constants'

/**
 * Reveals `markers` in fixed-size batches as an IntersectionObserver sentinel
 * scrolls into view, resetting back to the first batch whenever the
 * (already filtered/sorted) marker list changes.
 */
export const useVisibleTaskMarkers = (markers: TaskMarker[]) => {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset visible count when filtered data changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [markers])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < markers.length) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, markers.length))
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, markers.length])

  return {
    visibleMarkers: markers.slice(0, visibleCount),
    hasMore: visibleCount < markers.length,
    sentinelRef,
  }
}
