import { useId } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'

export const LassoLayer = () => {
  const { lassoPolygon: polygon, drawingMode: mode } = useTaskMapContext()
  const id = useId()

  if (!polygon || polygon.length < 2) return null

  // Create a closed polygon for display (connect last point to first)
  const closedCoordinates = [...polygon, polygon[0]]

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [closedCoordinates],
        },
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: closedCoordinates,
        },
      },
    ],
  }

  const fillColor = mode === 'deselect' ? '#ef4444' : '#3b82f6'
  const strokeColor = mode === 'deselect' ? '#dc2626' : '#2563eb'

  return (
    <Source id={`${id}-lasso-source`} type="geojson" data={geojson}>
      <Layer
        id={`${id}-lasso-fill`}
        type="fill"
        paint={{
          'fill-color': fillColor,
          'fill-opacity': 0.2,
        }}
      />
      <Layer
        id={`${id}-lasso-line`}
        type="line"
        paint={{
          'line-color': strokeColor,
          'line-width': 2,
          'line-dasharray': [2, 2],
        }}
      />
    </Source>
  )
}
