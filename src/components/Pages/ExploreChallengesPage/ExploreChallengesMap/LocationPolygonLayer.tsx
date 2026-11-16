import { useId, useMemo } from 'react'
import type { LayerProps } from 'react-map-gl/maplibre'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { LocationGeojson } from '../contexts/ExploreChallengesSearchContext'

const fillLayer: LayerProps = {
  id: 'location-polygon-fill',
  type: 'fill',
  paint: {
    'fill-color': '#3b82f6',
    'fill-opacity': 0.2,
  },
}

const fillOutlineLayer: LayerProps = {
  id: 'location-polygon-fill-outline',
  type: 'line',
  paint: {
    'line-color': '#3b82f6',
    'line-width': 2,
    'line-opacity': 0.8,
  },
}

interface LocationPolygonLayerProps {
  locationGeojson: LocationGeojson
}

export const LocationPolygonLayer = ({ locationGeojson }: LocationPolygonLayerProps) => {
  const sourceId = useId()

  // Reason: constructs GeoJSON feature collection from geometry - avoids rebuilding on every render
  const featureCollection = useMemo(() => {
    if (!locationGeojson) return null

    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: locationGeojson,
          properties: {},
        },
      ],
    }
  }, [locationGeojson])

  if (!featureCollection) {
    return null
  }

  return (
    <Source id={sourceId} type="geojson" data={featureCollection}>
      <Layer {...fillLayer} />
      <Layer {...fillOutlineLayer} />
    </Source>
  )
}
