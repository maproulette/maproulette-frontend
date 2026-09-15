import { useEffect, useId, useMemo, useState } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { api } from '@/api'
import { createDirectionIcons } from '@/components/Map/createDirectionIcons'
import {
  buildDirectionEndpoints,
  DIRECTION_ICONS,
  hasDirectionalGeometry,
} from '@/components/Map/directionIndicators'
import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskFeatureContext } from '@/components/Pages/TaskEditPage/contexts/TaskFeatureContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { decorateTaskFeatures } from '@/lib/decorateTaskFeatures'
import { parseStyleRules } from '@/lib/taskFeatureStyle'
import { useTaskEditMapContext } from './TaskEditMapContext'

// Colors for geometry highlighting
const DEFAULT_COLOR = '#6366f1' // indigo
const SELECTED_COLOR = '#8b5cf6' // purple (matches marker highlight)
const HIGHLIGHT_COLOR = '#f59e0b' // amber (feature picked out from the panel)

/**
 * TaskGeometryLayer that always shows the primary task's geometries,
 * geometries for bundled tasks, and geometries for the selected marker.
 *
 * A task built from a GeoJSON FeatureCollection owns several features at once;
 * they are all drawn here as the one task they are, with direction indicators
 * on any line, and any single one of them can be picked out (highlighted) or
 * isolated from the task's property list.
 */
export const TaskGeometryLayer = () => {
  const { selectedMarker } = useTaskMapContext()
  // `mapLoaded` lives on TaskEditMapContext — that is the flag <MapGL onLoad>
  // actually sets (TaskMapContext carries an identically named one that
  // nothing ever flips).
  const { mapRef, mapLoaded } = useTaskEditMapContext()
  const { activeBundle } = useTaskBundleContext()
  const { task } = useTaskContext()
  const { challenge } = useChallengeContext()
  const { focusedFeatureKey, highlightedFeatureKey, showDirectionIndicators } =
    useTaskFeatureContext()
  const primaryTaskId = task.id

  const sourceId = useId()
  const layerId = useId()
  const endpointSourceId = useId()
  const endpointLayerId = useId()

  const [directionIconsReady, setDirectionIconsReady] = useState(false)

  // Always fetch the primary task's geometries
  const { data: primaryTask } = api.task.getTask(primaryTaskId)

  // Fetch bundled task geometries (excluding primary task)
  const bundledTaskIds = activeBundle?.taskIds.filter((id) => id !== primaryTaskId) ?? []
  const { data: bundledTasks } = api.task.getTasks(bundledTaskIds)

  // Fetch selected marker task data if there's a marker selected
  const selectedTaskId = selectedMarker?.id ?? null
  const { data: selectedTask } = api.task.getTask(selectedTaskId ?? 0)

  useEffect(() => {
    if (!mapLoaded) return
    const map = mapRef.current?.getMap()
    if (!map) return

    const register = () =>
      createDirectionIcons({ current: map }, () => setDirectionIconsReady(true))
    register()

    // Switching basemaps reloads the style and throws away registered images,
    // so put them back as soon as a layer asks for one that has gone missing.
    const onImageMissing = (event: { id: string }) => {
      if (Object.values(DIRECTION_ICONS).some((name) => name === event.id)) register()
    }
    map.on('styleimagemissing', onImageMissing)
    return () => {
      map.off('styleimagemissing', onImageMissing)
    }
  }, [mapLoaded, mapRef])

  // Conditional styles configured on the challenge, applied on top of each
  // feature's own simplestyle properties.
  const styleRules = useMemo(() => parseStyleRules(challenge?.taskStyles), [challenge?.taskStyles])

  const geometries = useMemo(() => {
    const allFeatures: GeoJSON.Feature[] = []

    if (primaryTask) {
      allFeatures.push(...decorateTaskFeatures(primaryTask, styleRules).features)
    }

    if (bundledTasks) {
      for (const task of bundledTasks) {
        allFeatures.push(...decorateTaskFeatures(task, styleRules).features)
      }
    }

    if (
      selectedMarker &&
      selectedTask &&
      selectedTask.id !== primaryTaskId &&
      !activeBundle?.taskIds.includes(selectedTask.id)
    ) {
      allFeatures.push(...decorateTaskFeatures(selectedTask, styleRules).features)
    }

    // Focusing one feature hides the rest of the task's geometry, so a single
    // feature of a crowded FeatureCollection can be looked at on its own.
    const features = focusedFeatureKey
      ? allFeatures.filter((f) => f.properties?.featureKey === focusedFeatureKey)
      : allFeatures

    if (features.length === 0) return null
    return { type: 'FeatureCollection' as const, features }
  }, [
    selectedMarker,
    primaryTask,
    primaryTaskId,
    selectedTask,
    bundledTasks,
    activeBundle,
    focusedFeatureKey,
    styleRules,
  ])

  const directionEndpoints = useMemo(
    () => (geometries ? buildDirectionEndpoints(geometries.features) : null),
    [geometries]
  )

  if (!geometries) {
    return null
  }

  const hasPolygon = geometries.features.some(
    (f) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
  )
  const hasLineString = geometries.features.some(
    (f) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
  )
  const hasPoint = geometries.features.some(
    (f) => f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint'
  )

  const showDirections = showDirectionIndicators && directionIconsReady
  const showArrows = showDirections && hasDirectionalGeometry(geometries.features)
  const showEndpoints = showDirections && (directionEndpoints?.features.length ?? 0) > 0

  // Paint properties follow the same precedence everywhere: the feature picked
  // out from the property list wins, then the task of a selected marker, then
  // the task's own default.
  const byEmphasis = (highlighted: unknown, selected: unknown, base: unknown) => {
    const cases: unknown[] = ['case']
    if (highlightedFeatureKey) {
      cases.push(['==', ['get', 'featureKey'], highlightedFeatureKey], highlighted)
    }
    if (selectedTaskId) {
      cases.push(['==', ['get', 'taskId'], selectedTaskId], selected)
    }
    cases.push(base)
    return cases.length === 2 ? base : cases
  }

  // A feature's own color, where the data gave it one.
  const styled = (property: string, fallback: unknown) => ['coalesce', ['get', property], fallback]

  const getFillPaint = () => ({
    'fill-color': byEmphasis(HIGHLIGHT_COLOR, SELECTED_COLOR, styled('mrFill', DEFAULT_COLOR)),
    'fill-opacity': byEmphasis(0.45, 0.3, styled('mrFillOpacity', 0.3)),
  })

  const getLinePaint = () => ({
    'line-color': byEmphasis(HIGHLIGHT_COLOR, SELECTED_COLOR, styled('mrStroke', DEFAULT_COLOR)),
    'line-width': byEmphasis(7, 6, styled('mrStrokeWidth', 4)),
    'line-opacity': styled('mrStrokeOpacity', 1),
  })

  const getCirclePaint = () => ({
    'circle-color': byEmphasis(
      HIGHLIGHT_COLOR,
      SELECTED_COLOR,
      styled('mrMarkerColor', DEFAULT_COLOR)
    ),
    'circle-radius': byEmphasis(9, 8, 6),
    'circle-stroke-width': 4,
    'circle-stroke-color': '#ffffff',
  })

  return (
    <>
      <Source id={sourceId} type="geojson" data={geometries}>
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
