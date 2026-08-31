import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { TaskTypeKey } from '@/components/Map/TaskMarkers/taskTypes'
import type { TaskMarker } from '@/types/Task'

// Color palette for spider lines - distinct, visible colors
const SPIDER_LINE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
] as const

interface SpiderMarkersProps {
  markers: TaskMarker[]
  spiderPositions: Map<number, { original: [number, number]; spidered: [number, number] }>
  primaryTaskId?: number
  activeBundle?: { bundleId: number; taskIds: number[] } | null
  selectedTaskId?: number | null
  activeTaskId?: number | null
  lassoSelectedTaskIds?: Set<number>
  hoveredTaskId?: number | null
}

/**
 * Renders markers at spider positions with lines connecting to original positions
 */
export const SpiderMarkers = ({
  markers,
  spiderPositions,
  primaryTaskId,
  activeBundle,
  selectedTaskId,
  activeTaskId,
  lassoSelectedTaskIds = new Set(),
  hoveredTaskId,
}: SpiderMarkersProps) => {
  const SPIDER_SOURCE_ID = 'spider-lines'
  const SPIDER_LINES_OUTLINE_ID = 'spider-lines-outline'
  const SPIDER_LINES_LAYER_ID = 'spider-lines-layer'
  const SPIDERED_MARKERS_SOURCE_ID = 'spidered-markers'
  const SPIDERED_MARKERS_LAYER_ID = 'spidered-markers-layer'

  const spideredGeoJSON = useMemo(() => {
    const features = markers
      .map((marker) => {
        const position = spiderPositions.get(marker.id)
        if (!position) return null

        const isPrimary = marker.id === primaryTaskId
        const isBundled = activeBundle?.taskIds.includes(marker.id) ?? false
        const isSelected = marker.id === selectedTaskId
        const isActive = marker.id === activeTaskId
        const isLassoSelected = lassoSelectedTaskIds.has(marker.id)
        const isHovered = marker.id === hoveredTaskId
        const typeKey = (marker as TaskMarker & { typeKey?: TaskTypeKey | null }).typeKey ?? null

        return {
          type: 'Feature' as const,
          properties: {
            id: marker.id,
            status: marker.status ?? 0,
            priority: marker.priority ?? 0,
            isHighlighted: isPrimary || isBundled,
            isPrimary,
            isSelected,
            isActive,
            isLassoSelected,
            isHovered,
            isSpidered: true,
            ...(typeKey ? { typeKey } : {}),
          },
          geometry: {
            type: 'Point' as const,
            coordinates: position.spidered,
          },
        }
      })
      .filter((f) => f !== null)

    return {
      type: 'FeatureCollection' as const,
      features,
    } as GeoJSON.FeatureCollection
  }, [
    markers,
    spiderPositions,
    primaryTaskId,
    activeBundle,
    selectedTaskId,
    activeTaskId,
    lassoSelectedTaskIds,
    hoveredTaskId,
  ])

  const spiderLinesGeoJSON = useMemo(() => {
    let colorIndex = 0
    const features = markers
      .map((marker) => {
        const position = spiderPositions.get(marker.id)
        if (!position) return null

        if (
          marker.location.lng === position.spidered[0] &&
          marker.location.lat === position.spidered[1]
        ) {
          return null
        }

        const isSelected = marker.id === selectedTaskId
        const isActive = marker.id === activeTaskId
        const markerCenter = [marker.location.lng, marker.location.lat]
        const feature = {
          type: 'Feature' as const,
          properties: {
            taskId: marker.id,
            colorIndex: colorIndex % SPIDER_LINE_COLORS.length,
            isSelected,
            isActive,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [markerCenter, position.spidered],
          },
        }
        colorIndex++
        return feature
      })
      .filter((f) => f !== null)

    return {
      type: 'FeatureCollection' as const,
      features,
    } as GeoJSON.FeatureCollection
  }, [markers, spiderPositions, selectedTaskId, activeTaskId])

  return (
    <>
      {/* Render spider lines */}
      {spiderLinesGeoJSON.features.length > 0 && (
        <Source id={SPIDER_SOURCE_ID} type="geojson" data={spiderLinesGeoJSON} lineMetrics={true}>
          {/* White outline for contrast */}
          <Layer
            id={SPIDER_LINES_OUTLINE_ID}
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 4,
              'line-opacity': 0.9,
            }}
          />
          {/* Colored line on top of outline */}
          <Layer
            id={SPIDER_LINES_LAYER_ID}
            type="line"
            paint={{
              'line-color': [
                'case',

                ['==', ['get', 'isActive'], true],
                '#8b5cf6',

                ['==', ['get', 'isSelected'], true],
                '#8b5cf6',

                [
                  'match',
                  ['get', 'colorIndex'],
                  0,
                  '#ef4444', // red
                  1,
                  '#f97316', // orange
                  2,
                  '#eab308', // yellow
                  3,
                  '#22c55e', // green
                  4,
                  '#14b8a6', // teal
                  5,
                  '#3b82f6', // blue
                  6,
                  '#8b5cf6', // violet
                  7,
                  '#ec4899', // pink
                  8,
                  '#06b6d4', // cyan
                  9,
                  '#84cc16', // lime
                  '#6366f1', // default fallback
                ],
              ],
              'line-width': [
                'case',

                ['==', ['get', 'isActive'], true],
                4,

                ['==', ['get', 'isSelected'], true],
                4,

                2.5,
              ],
              'line-opacity': 1,
            }}
          />
        </Source>
      )}

      {/* Render spidered markers using the existing unclustered layer style */}
      <Source id={SPIDERED_MARKERS_SOURCE_ID} type="geojson" data={spideredGeoJSON}>
        <Layer
          id={SPIDERED_MARKERS_LAYER_ID}
          type="symbol"
          layout={{
            'icon-image': [
              'case',

              ['get', 'isHovered'],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-hovered',
              ],

              ['get', 'isPrimary'],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-primary',
              ],

              ['all', ['get', 'isHighlighted'], ['get', 'isActive']],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-bundled-selected',
              ],

              ['all', ['get', 'isHighlighted'], ['get', 'isSelected']],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-bundled-selected',
              ],

              ['get', 'isHighlighted'],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-bundled',
              ],

              ['all', ['get', 'isLassoSelected'], ['get', 'isActive']],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-lasso-selected',
              ],

              ['all', ['get', 'isLassoSelected'], ['get', 'isSelected']],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-lasso-selected',
              ],

              // Type-aware selected/active variant — preserves the type
              // indicator on the spider overlay when a typed task is the
              // selected/active one.
              ['all', ['has', 'typeKey'], ['any', ['get', 'isActive'], ['get', 'isSelected']]],
              [
                'concat',
                'marker-type-',
                ['to-string', ['get', 'typeKey']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-selected',
              ],

              ['get', 'isActive'],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-selected',
              ],

              ['get', 'isSelected'],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-selected',
              ],

              ['get', 'isLassoSelected'],
              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
                '-lasso',
              ],

              // Plain spidered marker — keep type indicator when available.
              ['has', 'typeKey'],
              [
                'concat',
                'marker-type-',
                ['to-string', ['get', 'typeKey']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
              ],

              [
                'concat',
                'marker-pin-',
                ['to-string', ['get', 'status']],
                '-',
                ['to-string', ['coalesce', ['get', 'priority'], 1]],
              ],
            ],
            'icon-size': [
              'case',

              [
                'any',
                ['get', 'isHighlighted'],
                ['get', 'isActive'],
                ['get', 'isSelected'],
                ['get', 'isHovered'],
              ],
              1.4,

              1.0,
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'symbol-sort-key': [
              'case',
              ['get', 'isHovered'],
              1300,
              ['get', 'isPrimary'],
              1200,
              ['all', ['get', 'isHighlighted'], ['get', 'isActive']],
              1100,
              ['all', ['get', 'isHighlighted'], ['get', 'isSelected']],
              1100,
              ['get', 'isHighlighted'],
              1000,
              ['all', ['get', 'isLassoSelected'], ['get', 'isActive']],
              950,
              ['all', ['get', 'isLassoSelected'], ['get', 'isSelected']],
              950,
              ['get', 'isActive'],
              900,
              ['get', 'isSelected'],
              900,
              ['get', 'isLassoSelected'],
              850,
              0,
            ],
          }}
        />
      </Source>
    </>
  )
}
