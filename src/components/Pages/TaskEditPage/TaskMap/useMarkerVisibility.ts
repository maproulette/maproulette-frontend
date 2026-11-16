import { useEffect, useRef } from 'react'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'

export const useMarkerVisibility = () => {
  const { selectedMarker, markersHidden, setMarkersHidden } = useTaskMapContext()
  const prevSelectedMarkerRef = useRef<typeof selectedMarker>(null)

  // Reset markersHidden only when selectedMarker transitions from non-null to null
  // (i.e., when a popup is closed, not when it was already null)
  useEffect(() => {
    const hadMarker = prevSelectedMarkerRef.current !== null
    const hasMarker = selectedMarker !== null

    // Only reset if we had a marker before and now we don't
    if (hadMarker && !hasMarker && markersHidden) {
      setMarkersHidden(false)
    }

    prevSelectedMarkerRef.current = selectedMarker
  }, [selectedMarker, markersHidden, setMarkersHidden])
}
