import { useId, useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import {
  buildDirectionEndpoints,
  DIRECTION_ICONS,
  hasDirectionalGeometry,
} from '@/components/Map/directionIndicators'

const DEFAULT_COLOR = '#6366f1' // indigo
const SELECTED_COLOR = '#8b5cf6' // purple (matches marker highlight)
const HIGHLIGHT_COLOR = '#f59e0b' // amber (feature picked out from the panel)
const NO_OUTLINE = 'rgba(0, 0, 0, 0)'
const OUTLINE_EXTRA_WIDTH = 8

interface TaskGeometrySourceProps {
  geometries: GeoJSON.FeatureCollection
  /** Part keys of the one feature picked out from a task's property list. */
  highlightedKeys?: string[] | null
  /** Task whose geometry is outlined as the selected one. */
  emphasizedTaskId?: number | null
  showDirections?: boolean
}

/**
 * Draws a task's geometry: the shared look every map gives a task's features,
 * so a line or point is the same weight and color whether it is seen while
 * mapping, browsing a challenge, or managing one.
 *
 * A feature keeps its own colors when it is selected or picked out; the
 * emphasis is an outline drawn around it, so a challenge's styling still reads
 * on the task being worked on.
 */
export const TaskGeometrySource = ({
  geometries,
  highlightedKeys = null,
  emphasizedTaskId = null,
  showDirections = false,
}: TaskGeometrySourceProps) => {
  const sourceId = useId()
  const layerId = useId()
  const endpointSourceId = useId()
  const endpointLayerId = useId()

  const directionEndpoints = useMemo(
    () => (showDirections ? buildDirectionEndpoints(geometries.features) : null),
    [geometries, showDirections]
  )

  const hasPolygon = geometries.features.some(
    (f) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
  )
  const hasLineString = geometries.features.some(
    (f) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
  )
  const hasPoint = geometries.features.some(
    (f) => f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint'
  )

  const showArrows = showDirections && hasDirectionalGeometry(geometries.features)
  const showEndpoints = showDirections && (directionEndpoints?.features.length ?? 0) > 0

  // Emphasis follows the same precedence everywhere: the feature picked out
  // from the property list wins, then the task of a selected marker, then
  // nothing. It only ever decides the outline -- the feature's own colors are
  // left alone.
  const byEmphasis = (highlighted: unknown, selected: unknown, base: unknown) => {
    const cases: unknown[] = ['case']
    if (highlightedKeys?.length) {
      cases.push(['in', ['get', 'partKey'], ['literal', highlightedKeys]], highlighted)
    }
    if (emphasizedTaskId) {
      cases.push(['==', ['get', 'taskId'], emphasizedTaskId], selected)
    }
    cases.push(base)
    return cases.length === 2 ? base : cases
  }

  const hasEmphasis = Boolean(highlightedKeys?.length) || Boolean(emphasizedTaskId)

  // A feature's own color, where the data gave it one.
  const styled = (property: string, fallback: unknown) => ['coalesce', ['get', property], fallback]

  const getFillPaint = () => ({
    'fill-color': styled('mrFill', DEFAULT_COLOR),
    'fill-opacity': styled('mrFillOpacity', 0.3),
  })

  const getLinePaint = () => ({
    'line-color': styled('mrStroke', DEFAULT_COLOR),
    'line-width': styled('mrStrokeWidth', 4),
    'line-opacity': styled('mrStrokeOpacity', 1),
  })

  // Drawn under the feature and wider than it, so what shows is a ring around
  // the feature's own stroke rather than a recoloring of it.
  const getOutlinePaint = () => ({
    'line-color': byEmphasis(HIGHLIGHT_COLOR, SELECTED_COLOR, NO_OUTLINE),
    'line-width': ['+', styled('mrStrokeWidth', 4), OUTLINE_EXTRA_WIDTH],
    'line-opacity': 1,
  })

  const getCirclePaint = () => ({
    'circle-color': styled('mrMarkerColor', DEFAULT_COLOR),
    'circle-radius': 11,
    'circle-stroke-width': byEmphasis(6, 6, 4),
    'circle-stroke-color': byEmphasis(HIGHLIGHT_COLOR, SELECTED_COLOR, '#ffffff'),
  })

  return (
    <>
      <Source id={sourceId} type="geojson" data={geometries}>
        {hasEmphasis && (hasLineString || hasPolygon) && (
          <Layer
            id={`${layerId}-outline`}
            type="line"
            filter={[
              'match',
              ['geometry-type'],
              ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'],
              true,
              false,
            ]}
            paint={getOutlinePaint() as maplibregl.LineLayerSpecification['paint']}
          />
        )}
        {hasPolygon && (
          <Layer
            id={`${layerId}-fill`}
            type="fill"
            // Without this a fill layer also fills the area a line encloses,
            // and every task that happens to contain a polygon would paint
            // over its own lines.
            filter={['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false]}
            paint={getFillPaint() as maplibregl.FillLayerSpecification['paint']}
          />
        )}
        {hasPolygon && (
          <Layer
            id={`${layerId}-fill-outline`}
            type="line"
            filter={['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false]}
            paint={getLinePaint() as maplibregl.LineLayerSpecification['paint']}
          />
        )}
        {hasLineString && (
          <Layer
            id={`${layerId}-line`}
            type="line"
            filter={['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false]}
            paint={getLinePaint() as maplibregl.LineLayerSpecification['paint']}
          />
        )}
        {hasPoint && (
          <Layer
            id={`${layerId}-point`}
            type="circle"
            // A circle layer draws a circle at every vertex of every feature,
            // so without this one point feature covers the task's lines and
            // polygons in dots.
            filter={['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false]}
            paint={getCirclePaint() as maplibregl.CircleLayerSpecification['paint']}
          />
        )}
        {showArrows && (
          <Layer
            id={`${layerId}-direction-arrows`}
            type="symbol"
            filter={['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false]}
            layout={{
              // Placed along the line, so MapLibre rotates each arrow to the
              // bearing of the segment it lands on.
              'symbol-placement': 'line',
              'symbol-spacing': 70,
              'icon-image': DIRECTION_ICONS.arrow,
              'icon-size': 1,
              'icon-rotation-alignment': 'map',
              // Without this MapLibre flips symbols on lines that run
              // right-to-left, which would point the arrows the wrong way.
              'icon-keep-upright': false,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-padding': 0,
            }}
          />
        )}
      </Source>

      {showEndpoints && directionEndpoints && (
        <Source id={endpointSourceId} type="geojson" data={directionEndpoints}>
          <Layer
            id={`${endpointLayerId}-start`}
            type="symbol"
            filter={['==', ['get', 'role'], 'start']}
            layout={{
              'icon-image': DIRECTION_ICONS.start,
              'icon-size': 1,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            }}
          />
          <Layer
            id={`${endpointLayerId}-end`}
            type="symbol"
            filter={['==', ['get', 'role'], 'end']}
            layout={{
              'icon-image': DIRECTION_ICONS.end,
              'icon-size': 1,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            }}
          />
        </Source>
      )}
    </>
  )
}
