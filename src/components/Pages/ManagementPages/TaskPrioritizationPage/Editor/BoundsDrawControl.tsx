import { Eraser, Hand, MousePointer2, Pencil, Square, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import {
  type GeoJSONStoreFeatures,
  type HexColor,
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawSelectMode,
} from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { PRIORITY_COLOR, type TaskPriorityValue } from '@/types/Priority'
import { TIER_TO_PRIORITY, type Tier } from '../PrioritizationContext'

interface Props {
  tier: Tier
  map: React.RefObject<MapRef | null>
  mapLoaded: boolean
  value: GeoJSON.FeatureCollection | null
  onChange: (next: GeoJSON.FeatureCollection | null) => void
  className?: string
}

// `idle` uses terra-draw's built-in "static" mode, which the TerraDraw
// constructor auto-registers — it renders existing features but swallows all
// interaction, so the map is pannable without any tool being "armed". The
// previous default of `select` meant every click could accidentally mutate a
// shape.
type DrawMode = 'idle' | 'select' | 'polygon' | 'rectangle'

const TERRA_MODE: Record<DrawMode, string> = {
  idle: 'static',
  select: 'select',
  polygon: 'polygon',
  rectangle: 'rectangle',
}

const buildModeHelp = (t: ReturnType<typeof useIntl>['t']): Record<DrawMode, string> => ({
  idle: t(
    'taskPrioritizationPage.boundsDrawControl.helpIdle',
    undefined,
    'Pan and zoom the map. Pick a tool to draw or edit this tier’s bounds.'
  ),
  polygon: t(
    'taskPrioritizationPage.boundsDrawControl.helpPolygon',
    undefined,
    'Click to drop each vertex; double-click or press Enter to finish. Use this for any non-rectangular area.'
  ),
  rectangle: t(
    'taskPrioritizationPage.boundsDrawControl.helpRectangle',
    undefined,
    'Click and drag to draw an axis-aligned rectangle.'
  ),
  select: t(
    'taskPrioritizationPage.boundsDrawControl.helpSelect',
    undefined,
    'Click a shape to select it, then drag a vertex to reshape, a midpoint to insert a new vertex, or the whole shape to move it. Right-click a vertex to delete it.'
  ),
})

const featureToFC = (
  features: GeoJSON.Feature[] | null | undefined
): GeoJSON.FeatureCollection | null => {
  if (!features || features.length === 0) return null
  return { type: 'FeatureCollection', features }
}

const isPolygonish = (f: GeoJSON.Feature) =>
  f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'

// terra-draw's `addFeatures` rejects features missing `properties.mode` (or
// referring to a mode not in the instantiated list). Polygons saved by MR3
// only carry a `name` property, so they'd silently be dropped on seed — the
// first new draw would then overwrite the persisted bounds. Normalize each
// seed feature to a valid mode + id before handing it to terra-draw.
const normalizeSeedFeature = (feature: GeoJSON.Feature): GeoJSONStoreFeatures => {
  const mode =
    typeof feature.properties?.mode === 'string' &&
    (feature.properties.mode === 'polygon' || feature.properties.mode === 'rectangle')
      ? feature.properties.mode
      : 'polygon'
  return {
    ...feature,
    id: feature.id ?? crypto.randomUUID(),
    properties: { ...(feature.properties ?? {}), mode },
  } as GeoJSONStoreFeatures
}

/**
 * Tier-scoped polygon/rectangle editor backed by terra-draw. Mounts on top of
 * the shared PreviewMap instance.
 */
export const BoundsDrawControl = ({ tier, map, mapLoaded, value, onChange, className }: Props) => {
  const { t } = useIntl()
  const MODE_HELP = buildModeHelp(t)
  const drawRef = useRef<TerraDraw | null>(null)
  const suppressChangeRef = useRef(false)
  // Tracks the `value` currently reflected on the terra-draw canvas, so the
  // resync effect below can tell "the canvas produced this value" (skip)
  // apart from "the value changed out from under us" (e.g. Discard — resync).
  const seededValueRef = useRef<GeoJSON.FeatureCollection | null>(null)
  const [activeMode, setActiveMode] = useState<DrawMode>('idle')
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const priority: TaskPriorityValue = TIER_TO_PRIORITY[tier]
  const color = PRIORITY_COLOR[priority].hex as HexColor

  // Initialize / teardown terra-draw instance tied to the map lifetime.
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    const mapInstance = map.current.getMap()
    if (!mapInstance) return
    let draw: TerraDraw | null = null
    try {
      // Full coordinate-editing flags: users can drag vertices to reshape,
      // drag midpoint handles to insert new vertices, and right-click to
      // delete a vertex — matching what the “Select” help text promises.
      const selectFlags = {
        feature: {
          draggable: true,
          coordinates: {
            draggable: true,
            midpoints: true,
            deletable: true,
          },
        },
      }
      draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({
          map: mapInstance,
          prefixId: `td-bounds-${tier}`,
        }),
        modes: [
          new TerraDrawSelectMode({
            flags: {
              polygon: selectFlags,
              rectangle: selectFlags,
            },
          }),
          new TerraDrawPolygonMode({
            styles: {
              fillColor: color,
              outlineColor: color,
              fillOpacity: 0.15,
              outlineWidth: 2,
            },
          }),
          new TerraDrawRectangleMode({
            styles: {
              fillColor: color,
              outlineColor: color,
              fillOpacity: 0.15,
              outlineWidth: 2,
            },
          }),
        ],
      })
      draw.start()
      draw.setMode(TERRA_MODE.idle)
    } catch (error) {
      logger.error('Failed to initialize terra-draw for bounds editor', { error, tier })
      return
    }
    drawRef.current = draw

    // Seed with existing polygons (if any), flagging to suppress the echo change event.
    if (value?.features?.length) {
      try {
        suppressChangeRef.current = true
        const seeded = value.features.filter(isPolygonish).map(normalizeSeedFeature)
        draw.addFeatures(seeded)
      } catch (error) {
        logger.warn('Could not seed bounds features', { error, tier })
      } finally {
        suppressChangeRef.current = false
      }
    }
    seededValueRef.current = value

    const handleChange = () => {
      if (!drawRef.current || suppressChangeRef.current) return
      const snap = drawRef.current.getSnapshot()
      const features = snap.filter(isPolygonish) as GeoJSON.Feature[]
      const next = featureToFC(features)
      seededValueRef.current = next
      onChange(next)
    }
    const handleSelect = (id: string | number) => setSelectedId(id)
    const handleDeselect = () => setSelectedId(null)

    draw.on('change', handleChange)
    draw.on('finish', handleChange)
    draw.on('select', handleSelect)
    draw.on('deselect', handleDeselect)

    return () => {
      try {
        draw?.stop()
      } catch (error) {
        logger.warn('Error stopping terra-draw', { error, tier })
      }
      drawRef.current = null
    }
    // Only re-init on map lifecycle changes; value seeding handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, map, tier, color])

  // Resync the canvas whenever `value` changes for a reason other than the
  // canvas itself producing it (e.g. Discard resetting the priority draft) —
  // otherwise stale shapes stick around since the effect above only reacts
  // to map-lifecycle changes.
  useEffect(() => {
    const draw = drawRef.current
    if (!draw) return
    if (value === seededValueRef.current) return
    try {
      suppressChangeRef.current = true
      const snap = draw.getSnapshot()
      const idsToRemove = snap.map((f) => f.id).filter((id) => id !== undefined)
      if (idsToRemove.length) draw.removeFeatures(idsToRemove)
      if (value?.features?.length) {
        const seeded = value.features.filter(isPolygonish).map(normalizeSeedFeature)
        draw.addFeatures(seeded)
      }
    } catch (error) {
      logger.warn('Could not resync bounds features', { error, tier })
    } finally {
      suppressChangeRef.current = false
    }
    seededValueRef.current = value
    setSelectedId(null)
  }, [value, tier])

  const setMode = (mode: DrawMode) => {
    setActiveMode(mode)
    // Leaving select mode also drops any current selection so the delete
    // button doesn't linger pointing at a feature the user can't see selected.
    if (mode !== 'select') setSelectedId(null)
    drawRef.current?.setMode(TERRA_MODE[mode])
  }

  const clearAll = () => {
    if (!drawRef.current) return
    try {
      suppressChangeRef.current = true
      const snap = drawRef.current.getSnapshot()
      drawRef.current.removeFeatures(snap.map((f) => f.id).filter((id) => id !== undefined))
    } catch (error) {
      logger.warn('Could not clear bounds', { error, tier })
    } finally {
      suppressChangeRef.current = false
    }
    setSelectedId(null)
    seededValueRef.current = null
    onChange(null)
  }

  const deleteSelected = () => {
    if (!drawRef.current || selectedId == null) return
    try {
      drawRef.current.removeFeatures([selectedId])
    } catch (error) {
      logger.warn('Could not delete selected bound', { error, tier })
    }
    setSelectedId(null)
  }

  const hasBounds = !!value && !!value.features?.length

  return (
    <div
      className={cn(
        'inline-flex flex-col gap-1 rounded-md border border-zinc-200 bg-white/95 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/95',
        className
      )}
    >
      <div className="inline-flex flex-wrap items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={activeMode === 'idle' ? 'default' : 'ghost'}
          onClick={() => setMode('idle')}
          title={t(
            'taskPrioritizationPage.boundsDrawControl.panTitle',
            undefined,
            'Pan the map with no drawing tool active'
          )}
          aria-label={t(
            'taskPrioritizationPage.boundsDrawControl.panAriaLabel',
            undefined,
            'Pan mode (no tool active)'
          )}
        >
          <Hand className="size-3.5" />
          {t('taskPrioritizationPage.boundsDrawControl.pan', undefined, 'Pan')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeMode === 'polygon' ? 'default' : 'ghost'}
          onClick={() => setMode('polygon')}
          title={MODE_HELP.polygon}
          aria-label={t(
            'taskPrioritizationPage.boundsDrawControl.drawPolygonAriaLabel',
            { tier },
            'Draw polygon for {tier} priority'
          )}
        >
          <Pencil className="size-3.5" />
          {t('taskPrioritizationPage.boundsDrawControl.polygon', undefined, 'Polygon')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeMode === 'rectangle' ? 'default' : 'ghost'}
          onClick={() => setMode('rectangle')}
          title={MODE_HELP.rectangle}
          aria-label={t(
            'taskPrioritizationPage.boundsDrawControl.drawRectangleAriaLabel',
            { tier },
            'Draw rectangle for {tier} priority'
          )}
        >
          <Square className="size-3.5" />
          {t('taskPrioritizationPage.boundsDrawControl.rectangle', undefined, 'Rectangle')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeMode === 'select' ? 'default' : 'ghost'}
          onClick={() => setMode('select')}
          title={MODE_HELP.select}
          aria-label={t(
            'taskPrioritizationPage.boundsDrawControl.selectAriaLabel',
            undefined,
            'Select and edit an existing shape'
          )}
        >
          <MousePointer2 className="size-3.5" />
          {t('taskPrioritizationPage.boundsDrawControl.select', undefined, 'Select')}
        </Button>
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-slate-700" aria-hidden />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={deleteSelected}
          disabled={activeMode !== 'select' || selectedId == null}
          title={t(
            'taskPrioritizationPage.boundsDrawControl.deleteSelectedTitle',
            undefined,
            'Delete the currently selected shape'
          )}
        >
          <Trash2 className="size-3.5" />
          {t(
            'taskPrioritizationPage.boundsDrawControl.deleteSelected',
            undefined,
            'Delete selected'
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clearAll}
          disabled={!hasBounds}
          title={t(
            'taskPrioritizationPage.boundsDrawControl.clearAllTitle',
            undefined,
            'Remove every shape in this tier'
          )}
        >
          <Eraser className="size-3.5" />
          {t('taskPrioritizationPage.boundsDrawControl.clearAll', undefined, 'Clear all')}
        </Button>
      </div>
      <p className="px-1 text-xs text-zinc-600 leading-snug dark:text-slate-400">
        {MODE_HELP[activeMode]}
      </p>
    </div>
  )
}
