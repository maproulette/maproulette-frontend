import bbox from '@turf/bbox'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  EyeOff,
  GripVertical,
  Map as MapIcon,
  MousePointerClick,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/api'
import { parseOsmFeaturesFromTask } from '@/components/TaskInfoPanel/taskUtils/osmUtils'
import { useDraggablePanel } from '@/hooks/useDraggablePanel'
import { useIntl } from '@/i18n'
import { buildChangesetComment } from '@/lib/changesetComment'
import { type TagFix, tagFixes } from '@/lib/cooperativeWork'
import { type EntityEdit, pendingEdits } from '@/lib/idChanges'
import { logger } from '@/lib/logger'
import { getOSMToken } from '@/plugins/RapidEditorPlugin/editorUtils'
import { getIdGlobal, type IdContext, type IdGlobal, type IdIframeWindow } from '@/types/iDEditor'
import type { Bbox2D } from '@/types/Map'
import type { Task } from '@/types/Task'
import { applyTagFixesInId } from './applyTagFixes'
import { useChallengeContext } from './contexts/ChallengeContext'
import { useEditorContext } from './contexts/EditorContext'
import { useTaskBundleContext } from './contexts/TaskBundleContext'
import { useTaskContext } from './contexts/TaskContext'
import { useTaskMapContext } from './contexts/TaskMapContext'
import { PendingEditsModal } from './PendingEditsModal'

/** Filter entity IDs to only those currently loaded in the iD context, then enter modeSelect. */
/** Height of iD's own toolbar, which the controls start just beneath. */
const ID_TOOLBAR_HEIGHT = 150

const selectValidEntities = (
  ctx: IdContext,
  iDGlobal: IdGlobal | undefined,
  entityIds: string[]
) => {
  if (!iDGlobal?.modeSelect) return
  const validIds = entityIds.filter((id) => {
    try {
      return !!ctx.hasEntity(id)
    } catch {
      return false
    }
  })
  if (validIds.length > 0) {
    ctx.enter(iDGlobal.modeSelect(ctx, validIds))
  }
}

interface IdEditorViewProps {
  onClose: () => void
}

export const IdEditorView = ({ onClose }: IdEditorViewProps) => {
  const { t } = useIntl()
  const { task } = useTaskContext()
  const { challenge } = useChallengeContext()
  const { activeBundle } = useTaskBundleContext()
  const { map } = useTaskMapContext()
  const {
    idUnsavedCount,
    setIdUnsavedCount,
    idViewportRef,
    highlightIdEntityRef,
    taskToOsmIdRef,
    selectIdEntitiesRef,
  } = useEditorContext()
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const idContextRef = useRef<IdContext | null>(null)
  const osmEntityIdsRef = useRef<string[]>([])
  const tagFixesRef = useRef<TagFix[]>([])

  const [focusMode, setFocusMode] = useState(false)
  const [pendingEditsOpen, setPendingEditsOpen] = useState(false)
  const [currentEdits, setCurrentEdits] = useState<EntityEdit[]>([])
  const {
    panelRef,
    dragging,
    handleProps,
    style: panelStyle,
  } = useDraggablePanel('mr4:idEditor:controlsPosition', (size) => ({
    x: Math.max(12, (window.innerWidth - size.x) / 2),
    // Clear of iD's Inspect / Add Feature / Save row along the top.
    y: ID_TOOLBAR_HEIGHT,
  }))

  const hasUnsavedChanges = idUnsavedCount > 0

  const bundledTaskIds = useMemo(
    () => activeBundle?.taskIds.filter((id) => id !== task.id) ?? [],

    [activeBundle?.taskIds.join(','), task.id]
  )
  const { data: bundledTasks } = api.task.getTasks(bundledTaskIds)

  const { osmEntityIds, taskBounds } = useMemo(() => {
    const allTasks: Task[] = [task, ...(bundledTasks ?? [])]
    const ids: string[] = []
    const mapping: Record<number, string> = {}

    for (const t of allTasks) {
      const features = parseOsmFeaturesFromTask(t)
      for (const feature of features) {
        const prefix = feature.type === 'node' ? 'n' : feature.type === 'way' ? 'w' : 'r'
        const entityId = `${prefix}${feature.id}`
        ids.push(entityId)
        // First feature wins for the per-task highlight mapping
        if (!(t.id in mapping)) mapping[t.id] = entityId
      }

      // A tag fix names the elements it changes, and those are the ones the
      // mapper needs to look at. They are not always discoverable from the
      // task's own geometry properties, so without this a tag-fix task could
      // have a pending edit with nothing selected to inspect it on.
      for (const fix of tagFixes(t)) {
        if (!ids.includes(fix.entityId)) ids.push(fix.entityId)
        if (!(t.id in mapping)) mapping[t.id] = fix.entityId
      }
    }
    taskToOsmIdRef.current = mapping

    const features = allTasks.flatMap((t) => t.geometries.features)
    const taskBounds = bbox({ type: 'FeatureCollection', features }) as Bbox2D

    return { osmEntityIds: ids, taskBounds }
  }, [task.id, bundledTasks])

  osmEntityIdsRef.current = osmEntityIds
  // Tag changes proposed for this task and anything bundled with it.
  tagFixesRef.current = useMemo(
    () => [task, ...(bundledTasks ?? [])].flatMap((t) => tagFixes(t as Task)),
    [task, bundledTasks]
  )

  const position = useMemo(() => {
    if (map.current) {
      const maplibreMap = map.current.getMap()
      const { lng, lat } = maplibreMap.getCenter()
      return { lng, lat, zoom: maplibreMap.getZoom() }
    }
    const [lng, lat] = task.location.coordinates
    return { lng, lat, zoom: 18 }
  }, [task.id])

  const buildHash = useCallback(() => {
    const params = new URLSearchParams()
    params.set('map', `${position.zoom}/${position.lat}/${position.lng}`)
    params.set('comment', buildChangesetComment(challenge, task.id))
    if (task.id) params.set('maproulette_task', task.id.toString())
    if (osmEntityIds.length > 0) params.set('id', osmEntityIds.join(','))

    const token = getOSMToken()
    const osmApiServer = window.env.VITE_OSM_API_SERVER || 'https://api.openstreetmap.org'
    if (osmApiServer === 'https://api.openstreetmap.org' && token) {
      params.set('token', token)
    }

    return `#${params.toString()}`
  }, [position, task.id, osmEntityIds, challenge])

  const initialUrl = useMemo(() => `/id-editor.html?v=2${buildHash()}`, [buildHash])

  const handleResetView = () => {
    const ctx = idContextRef.current
    if (!ctx?.map) return
    const [west, south, east, north] = taskBounds
    try {
      const lngPad = (east - west) * 0.3 || 0.002
      const latPad = (north - south) * 0.3 || 0.002
      const padded: [[number, number], [number, number]] = [
        [west - lngPad, south - latPad],
        [east + lngPad, north + latPad],
      ]
      ctx.map().extent(padded)
    } catch {
      ctx.map().centerZoom([(west + east) / 2, (south + north) / 2], 17)
    }
  }

  const handleShowPendingEdits = () => {
    setCurrentEdits(pendingEdits(idContextRef.current?.history?.()))
    setPendingEditsOpen(true)
  }

  const handleToggleFocusMode = () => {
    const newMode = !focusMode
    setFocusMode(newMode)
    try {
      const iframeDoc = iframeRef.current?.contentDocument
      const surface = idContextRef.current?.surface() ?? null
      if (iframeDoc && surface) {
        const mapContainer = iframeDoc.querySelector('.ideditor')
        if (mapContainer) {
          mapContainer.classList.toggle('mr-focus-mode', newMode)
        }

        if (newMode) {
          for (const id of osmEntityIdsRef.current) {
            surface.selectAll(`.${id}`).classed('mr-task', true)
          }
        }
      }
    } catch {}
  }

  const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = event.target as HTMLIFrameElement

    try {
      const win = iframe.contentWindow as IdIframeWindow | null
      const context = win?.setupiD?.()
      if (!context) {
        logger.error('iD editor setupiD() returned no context')
        setIsLoading(false)
        return
      }
      idContextRef.current = context

      try {
        const iframeDoc = iframe.contentDocument
        if (iframeDoc) {
          const style = iframeDoc.createElement('style')
          style.id = 'mr-custom-styles'
          style.textContent = `
            .mr-active .shadow { stroke: #a855f7 !important; stroke-opacity: 0.95 !important; }
            .mr-active .stroke { stroke: #a855f7 !important; stroke-opacity: 0.9 !important; }

            .mr-focus-mode .layer-osm path,
            .mr-focus-mode .layer-osm circle,
            .mr-focus-mode .layer-osm text,
            .mr-focus-mode .layer-osm use,
            .mr-focus-mode .layer-osm image {
              display: none !important;
            }
            .mr-focus-mode .layer-osm .mr-task,
            .mr-focus-mode .layer-osm .mr-task *,
            .mr-focus-mode .layer-osm .highlighted,
            .mr-focus-mode .layer-osm .highlighted *,
            .mr-focus-mode .layer-osm .selected,
            .mr-focus-mode .layer-osm .selected *,
            .mr-focus-mode .layer-osm .mr-active,
            .mr-focus-mode .layer-osm .mr-active * {
              /* These selectors carry more classes than the hide rule above,
                 so they win it back. Display has to be reverted explicitly now
                 that focus mode removes the other elements rather than fading
                 them: opacity alone would leave them hidden. */
              display: revert !important;
              opacity: 1 !important;
            }
          `
          iframeDoc.head.appendChild(style)
        }
      } catch {}

      const iDGlobalForHighlight = getIdGlobal(iframe.contentWindow)
      let prevHighlightId: string | null = null
      highlightIdEntityRef.current = (osmEntityId: string | null) => {
        const surface = context.surface()
        if (!surface || !iDGlobalForHighlight?.utilHighlightEntities) return

        if (prevHighlightId) {
          iDGlobalForHighlight.utilHighlightEntities([prevHighlightId], false, context)
          surface.selectAll(`.${prevHighlightId}`).classed('mr-active', false)
        }

        if (osmEntityId && context.hasEntity(osmEntityId)) {
          iDGlobalForHighlight.utilHighlightEntities([osmEntityId], true, context)
          surface.selectAll(`.${osmEntityId}`).classed('mr-active', true)
        }
        prevHighlightId = osmEntityId
      }

      selectIdEntitiesRef.current = (osmEntityIds: string[]) => {
        try {
          selectValidEntities(context, iDGlobalForHighlight, osmEntityIds)
        } catch (e) {
          logger.error('[iD] selectIdEntities error', { error: e })
        }
      }

      if (context?.history) {
        context.history().on('change.maproulette', () => {
          const changes = context.history().changes()
          const count = changes.modified.length + changes.created.length + changes.deleted.length
          setIdUnsavedCount(count)
        })
      }

      if (context?.map) {
        context.map().on('move.maproulette', () => {
          const center = context.map().center()
          const zoom = context.map().zoom()
          idViewportRef.current = { lat: center[1], lng: center[0], zoom }
        })
      }

      // iD downloads the task's elements after the map settles, so selecting
      // them is retried until they arrive. A single delayed attempt used to
      // leave slow-loading elements — a tag fix's element in particular —
      // unselected, with nothing for the mapper to inspect the change on.
      const attemptInitialSelect = (attemptsLeft: number) => {
        const ids = osmEntityIdsRef.current
        if (!context || ids.length === 0 || attemptsLeft <= 0) return
        try {
          const iDGlobal = getIdGlobal(iframe.contentWindow)
          const loaded = ids.filter((id) => {
            try {
              return !!context.hasEntity(id)
            } catch {
              return false
            }
          })
          if (loaded.length > 0) {
            selectValidEntities(context, iDGlobal, loaded)
            return
          }
        } catch (e) {
          logger.error('[iD] initial select error', { error: e })
        }
        setTimeout(() => attemptInitialSelect(attemptsLeft - 1), 1000)
      }
      setTimeout(() => attemptInitialSelect(10), 2000)

      applyPendingTagFixes(context, iframe)

      setIsLoading(false)
    } catch (err) {
      logger.error('Failed to initialize iD editor', { error: err })
      setIsLoading(false)
    }
  }

  /**
   * Tag-fix challenges propose tag changes for the task's elements. They are
   * applied as pending edits once iD has loaded the elements, so the mapper
   * reviews and saves them like their own work rather than approving them
   * through a separate dialog. Elements arrive asynchronously, so this retries
   * for a few seconds before giving up.
   */
  const applyPendingTagFixes = useCallback((context: IdContext, iframe: HTMLIFrameElement) => {
    const fixes = tagFixesRef.current
    if (fixes.length === 0) return

    const remaining = new Set(fixes.map((fix) => fix.entityId))
    const attempt = (attemptsLeft: number) => {
      if (remaining.size === 0 || attemptsLeft <= 0) return
      const iDGlobal = getIdGlobal(iframe.contentWindow)
      const pending = fixes.filter((fix) => remaining.has(fix.entityId))
      for (const entityId of applyTagFixesInId(context, iDGlobal, pending)) {
        remaining.delete(entityId)
      }
      if (remaining.size > 0) setTimeout(() => attempt(attemptsLeft - 1), 1000)
    }
    setTimeout(() => attempt(8), 1500)
  }, [])

  const initialTaskIdRef = useRef(task.id)
  useEffect(() => {
    if (task.id === initialTaskIdRef.current) return
    const ctx = idContextRef.current
    if (!ctx?.map) return

    const [lng, lat] = task.location.coordinates
    ctx.map().centerZoom([lng, lat], 18)

    try {
      ctx.defaultChangesetComment(buildChangesetComment(challenge, task.id))
    } catch {}

    const retrySelect = (attemptsLeft: number) => {
      const ids = osmEntityIdsRef.current
      if (ids.length === 0 || attemptsLeft <= 0) return
      const iDGlobal = getIdGlobal(iframeRef.current?.contentWindow)
      const validIds = ids.filter((id) => {
        try {
          return !!ctx.hasEntity(id)
        } catch {
          return false
        }
      })
      if (validIds.length > 0) {
        selectValidEntities(ctx, iDGlobal, validIds)

        if (focusMode) {
          try {
            const surface = ctx.surface?.()
            if (surface) {
              for (const id of validIds) {
                surface.selectAll(`.${id}`).classed('mr-task', true)
              }
            }
          } catch {}
        }
      } else {
        setTimeout(() => retrySelect(attemptsLeft - 1), 500)
      }
    }
    setTimeout(() => retrySelect(6), 1000)
  }, [task.id])

  useEffect(() => {
    return () => {
      const context = idContextRef.current
      if (!context) return
      try {
        context.history?.().on('change.maproulette', null)
        context.map?.().on('move.maproulette', null)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  return (
    <div className="relative size-full bg-white dark:bg-slate-950">
      {/* MapRoulette's own controls, floating over iD. Dragging the panel by its
          handle moves it anywhere the mapper wants; it starts bottom right so
          it is clear of iD's own toolbars. */}
      <div
        ref={panelRef}
        style={panelStyle}
        className={`fixed z-20 flex items-stretch overflow-hidden rounded-lg shadow-lg ${
          dragging ? 'cursor-grabbing select-none' : ''
        }`}
      >
        {/* Drag handle, which doubles as the collapse toggle */}
        <div
          {...handleProps}
          className={`flex items-center bg-slate-900/95 pl-1.5 ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title={t('taskEditPage.idEditor.dragPanel', undefined, 'Drag to move these controls')}
        >
          <GripVertical className="h-4 w-4 text-slate-500" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="flex h-10 items-center gap-1.5 bg-slate-900/95 pr-2.5 pl-2 shadow-md transition-colors hover:bg-slate-800"
          title={
            drawerOpen
              ? t('taskEditPage.idEditor.collapsePanel', undefined, 'Collapse panel')
              : t('taskEditPage.idEditor.expandPanel', undefined, 'Expand panel')
          }
        >
          {drawerOpen ? (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
          )}
          <img src="/logo192.png" alt="MapRoulette" className="h-5 w-5" />
        </button>

        {/* Collapsible drawer content */}
        <div
          className={`flex items-center overflow-hidden transition-all duration-200 ${drawerOpen ? 'max-w-[600px] opacity-100' : 'max-w-0 opacity-0'}`}
        >
          <div className="flex items-center gap-1 bg-slate-900/95 py-1.5 pr-2 pl-1 shadow-md">
            {/* Unsaved changes */}
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleShowPendingEdits}
                className="flex items-center gap-1.5 rounded-md bg-yellow-500/90 px-2.5 py-1.5 transition-colors hover:bg-yellow-400"
                title={t(
                  'taskEditPage.idEditor.reviewChanges',
                  undefined,
                  'Review the unsaved changes'
                )}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                <span className="whitespace-nowrap font-semibold text-[11px] text-white">
                  {t(
                    'taskEditPage.idEditor.unsavedChanges',
                    { count: idUnsavedCount },
                    '{count, plural, one {# unsaved change} other {# unsaved changes}}'
                  )}
                </span>
                <ChevronDown className="h-3 w-3 text-white/80" aria-hidden="true" />
              </button>
            )}

            {/* Action buttons */}
            <button
              type="button"
              onClick={handleResetView}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-[11px] text-slate-300 transition-colors hover:bg-slate-700/80 hover:text-white"
              title={t('common.resetViewToTaskLocation', undefined, 'Reset view to task location')}
            >
              <Crosshair className="h-4 w-4" />
              {t('taskEditPage.idEditor.reCenter', undefined, 'Re-Center')}
            </button>
            {osmEntityIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const ctx = idContextRef.current
                  const iDGlobal = getIdGlobal(iframeRef.current?.contentWindow)
                  if (!ctx || !iDGlobal) return
                  selectValidEntities(ctx, iDGlobal, osmEntityIdsRef.current)
                }}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-[11px] text-slate-300 transition-colors hover:bg-slate-700/80 hover:text-white"
                title={t(
                  'taskEditPage.idEditor.selectTasksTitle',
                  undefined,
                  'Select task features in iD'
                )}
              >
                <MousePointerClick className="h-4 w-4" />
                {t('taskEditPage.idEditor.selectTasks', undefined, 'Select Tasks')}
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleFocusMode}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-[11px] transition-colors ${
                focusMode
                  ? 'bg-purple-600/80 text-white hover:bg-purple-500'
                  : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
              title={
                focusMode
                  ? t('taskEditPage.idEditor.showAllTitle', undefined, 'Show all map features')
                  : t(
                      'taskEditPage.idEditor.focusTitle',
                      undefined,
                      'Dim other features to focus on tasks'
                    )
              }
            >
              {focusMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {focusMode
                ? t('taskEditPage.idEditor.showAll', undefined, 'Show All')
                : t('taskEditPage.idEditor.focus', undefined, 'Focus')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-[11px] text-slate-300 transition-colors hover:bg-slate-700/80 hover:text-white"
              title={t(
                'taskEditPage.idEditor.closeEditorTitle',
                undefined,
                'Close editor and return to task map'
              )}
            >
              <MapIcon className="h-4 w-4" />
              {t('taskEditPage.idEditor.closeEditor', undefined, 'Close editor')}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-slate-950/80">
          <div className="text-center">
            <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            <div className="text-zinc-700 dark:text-zinc-300">
              {t('taskEditPage.idEditor.loading', undefined, 'Loading iD Editor...')}
            </div>
          </div>
        </div>
      )}

      {/* iD Editor Iframe — no sandbox because allow-same-origin + allow-scripts
          on a same-origin iframe negates sandboxing and triggers a browser warning */}
      <iframe
        ref={iframeRef}
        className="size-full border-0"
        src={initialUrl}
        onLoad={handleIframeLoad}
        title="iD Editor"
      />

      <PendingEditsModal
        open={pendingEditsOpen}
        onOpenChange={setPendingEditsOpen}
        edits={currentEdits}
      />
    </div>
  )
}
