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
import { tagFixes } from '@/lib/cooperativeWork'
import { changeSignature, pendingEdits } from '@/lib/idChanges'
import { logger } from '@/lib/logger'
import { getOSMToken } from '@/plugins/RapidEditorPlugin/editorUtils'
import {
  getIdGlobal,
  type IdContext,
  type IdGlobal,
  type IdIframeWindow,
  isEntityLoaded,
} from '@/types/iDEditor'
import type { Bbox2D } from '@/types/Map'
import type { Task } from '@/types/Task'
import {
  createTagFixQueue,
  markSuggestionCheckpoint,
  restoreSuggestionCheckpoint,
} from './applyTagFixes'
import { useChallengeContext } from './contexts/ChallengeContext'
import { useEditorContext } from './contexts/EditorContext'
import { useTaskBundleContext } from './contexts/TaskBundleContext'
import { useTaskContext } from './contexts/TaskContext'
import { useTaskMapContext } from './contexts/TaskMapContext'
import { PendingEditsModal } from './PendingEditsModal'

/** Height of iD's own toolbar, which the controls start just beneath. */
const ID_TOOLBAR_HEIGHT = 150

/**
 * The zoom iD starts downloading OSM data at, and below which it refuses to
 * edit. Opening the editor any further out shows the mapper a map with no
 * elements on it, so the initial view is never allowed below this.
 */
const ID_MIN_EDIT_ZOOM = 16

/** Filter entity IDs to only those currently loaded in the iD context, then enter modeSelect. */
const selectValidEntities = (
  ctx: IdContext,
  iDGlobal: IdGlobal | undefined,
  entityIds: string[]
) => {
  if (!iDGlobal?.modeSelect) return
  const validIds = entityIds.filter((id) => isEntityLoaded(ctx, id))
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
    setSuggestionApplied,
    setEditsDivergeFromSuggestion,
    setPendingEdits,
    pendingEdits: currentEdits,
    resetToSuggestionRef,
  } = useEditorContext()
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const idContextRef = useRef<IdContext | null>(null)
  const osmEntityIdsRef = useRef<string[]>([])

  // Focus mode starts on: a mapper opening the editor is here for the task's
  // own elements, and the surrounding data is a distraction until they ask for
  // it with the toggle.
  const [focusMode, setFocusMode] = useState(true)
  const [pendingEditsOpen, setPendingEditsOpen] = useState(false)

  const tagFixQueueRef = useRef(createTagFixQueue())
  // The editor's pending edits as they stood when MapRoulette last applied the
  // challenge's suggestion, which is what a reset goes back to. Null until it
  // has applied one, since there is nothing to return to before that.
  const suggestionSignatureRef = useRef<string | null>(null)
  // Set while the task's elements still need selecting, cleared once they are.
  const selectWhenLoadedRef = useRef(false)
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

  const focusModeRef = useRef(focusMode)
  focusModeRef.current = focusMode

  /** Mark elements as the task's own, which is what focus mode keeps visible. */
  const markTaskEntities = useCallback((entityIds: string[]) => {
    if (!focusModeRef.current) return
    const surface = idContextRef.current?.surface?.()
    if (!surface) return
    for (const id of entityIds) {
      surface.selectAll(`.${id}`).classed('mr-task', true)
    }
  }, [])

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
  // Tag changes proposed for this task and anything bundled with it. Changes
  // whenever a task joins or leaves the bundle.
  const taskTagFixes = useMemo(
    () => [task, ...(bundledTasks ?? [])].flatMap((t) => tagFixes(t as Task)),
    [task, bundledTasks]
  )

  const position = useMemo(() => {
    if (map.current) {
      const maplibreMap = map.current.getMap()
      const { lng, lat } = maplibreMap.getCenter()
      return { lng, lat, zoom: Math.max(maplibreMap.getZoom(), ID_MIN_EDIT_ZOOM) }
    }
    const [lng, lat] = task.location.coordinates
    return { lng, lat, zoom: 18 }
  }, [task.id])

  const buildHash = useCallback(() => {
    const params = new URLSearchParams()
    params.set('map', `${position.zoom}/${position.lat}/${position.lng}`)
    params.set('comment', buildChangesetComment(challenge, task))
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
    // Re-read on open as well as on history events, so the modal cannot show a
    // stale list if an event was ever missed.
    setPendingEdits(pendingEdits(idContextRef.current?.history?.()))
    setPendingEditsOpen(true)
  }

  const handleToggleFocusMode = () => {
    setFocusMode((on) => !on)
  }

  /**
   * Record where the editor stands as the state MapRoulette set up, which the
   * mapper can reset back to.
   *
   * Taken only when MapRoulette has just changed the editor itself — applying a
   * suggestion, or withdrawing one whose task left the bundle. Taking it on
   * anything else, a background refetch say, would quietly fold the mapper's
   * own work into the baseline and leave them nothing to reset.
   */
  const checkpointSuggestion = useCallback(() => {
    const context = idContextRef.current
    if (!context) return

    const signature = markSuggestionCheckpoint(context)
    if (signature === null) return

    suggestionSignatureRef.current = signature
    setSuggestionApplied(true)
    setEditsDivergeFromSuggestion(false)
  }, [setSuggestionApplied, setEditsDivergeFromSuggestion])

  /**
   * Apply every queued tag fix whose element iD has now downloaded.
   *
   * Runs each time iD merges new data into its graph, because that is the only
   * moment an element can become available — and it may be long after the
   * editor opened, since iD downloads nothing until the map is zoomed in far
   * enough to edit. Giving up after a few seconds of retries used to drop the
   * challenge's suggestion silently in exactly that case.
   */
  const flushPendingTagFixes = useCallback((): string[] => {
    const context = idContextRef.current
    if (!context) return []

    const settled = tagFixQueueRef.current.flush(
      context,
      getIdGlobal(iframeRef.current?.contentWindow)
    )
    if (settled.length > 0) checkpointSuggestion()
    return settled
  }, [checkpointSuggestion])

  /**
   * Select the task's elements as soon as iD has at least one of them, so the
   * mapper has the suggested change in front of them rather than an empty
   * inspector. Also merge-driven: waiting on a timer left the elements
   * unselected whenever the download took longer than the retries did.
   */
  const selectTaskEntitiesWhenLoaded = useCallback(() => {
    const context = idContextRef.current
    if (!context || !selectWhenLoadedRef.current) return

    const loaded = osmEntityIdsRef.current.filter((id) => isEntityLoaded(context, id))
    if (loaded.length === 0) return

    selectWhenLoadedRef.current = false
    try {
      selectValidEntities(context, getIdGlobal(iframeRef.current?.contentWindow), loaded)
      markTaskEntities(loaded)
    } catch (e) {
      logger.error('[iD] select task entities error', { error: e })
    }
  }, [markTaskEntities])

  // The merge listener is registered once, on iframe load, so it goes through a
  // ref to reach the current render's handlers.
  const onIdDataMergedRef = useRef<() => void>(() => {})
  onIdDataMergedRef.current = () => {
    flushPendingTagFixes()
    selectTaskEntitiesWhenLoaded()
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

      const iframeDoc = iframe.contentDocument
      if (iframeDoc) {
        const style = iframeDoc.createElement('style')
        style.id = 'mr-custom-styles'
        style.textContent = `
          /* iD puts a way's entity id on the same path as its paint class
             (path.shadow.w123) but wraps a node's paints in a group that
             carries the id (g.n123 > .shadow), so both forms are needed. */
          .mr-active .shadow,
          path.mr-active.shadow { stroke: #a855f7 !important; stroke-opacity: 0.95 !important; }
          .mr-active .stroke,
          path.mr-active.stroke { stroke: #a855f7 !important; stroke-opacity: 0.9 !important; }


          .mr-focus-mode .layer-osm path,
          .mr-focus-mode .layer-osm circle,
          .mr-focus-mode .layer-osm text,
          .mr-focus-mode .layer-osm use,
          .mr-focus-mode .layer-osm image {
            display: none !important;
          }

          /* iD hit-tests against its own touch/target layers, which are
             separate from the drawn geometry above. Hiding the drawing alone
             left invisible elements still clickable, so those layers are
             taken out of hit-testing too. */
          .mr-focus-mode .layer-touch,
          .mr-focus-mode .layer-touch *,
          .mr-focus-mode .layer-osm .shadow,
          .mr-focus-mode .layer-osm .target {
            pointer-events: none !important;
          }
          .mr-focus-mode .layer-osm .mr-task,
          .mr-focus-mode .layer-osm .mr-task *,
          .mr-focus-mode .layer-osm .highlighted,
          .mr-focus-mode .layer-osm .highlighted *,
          .mr-focus-mode .layer-osm .selected,
          .mr-focus-mode .layer-osm .selected *,
          /* The task's own elements stay both visible and clickable. */
          .mr-focus-mode .layer-touch .mr-task,
          .mr-focus-mode .layer-touch .mr-task *,
          .mr-focus-mode .layer-touch .selected,
          .mr-focus-mode .layer-touch .selected * {
            pointer-events: auto !important;
          }
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
          // Published so the task panel can show the mapper's actual edits as
          // they work, rather than only in the modal.
          setPendingEdits(pendingEdits(context.history()))
          // Anything that leaves the editor holding more than the challenge's
          // suggestion — an undo, a hand-edited tag, a moved node — is what
          // offers the reset. Before a suggestion has been applied there is no
          // state to go back to, so nothing is offered.
          const suggestion = suggestionSignatureRef.current
          setEditsDivergeFromSuggestion(
            suggestion !== null && changeSignature(context.history()) !== suggestion
          )
        })

        // iD downloads OSM data as the map settles and again whenever the
        // mapper pans or zooms in, merging what it gets into the graph. That is
        // when the task's elements — a tag fix's element in particular —
        // actually become available, so both selecting them and applying the
        // challenge's suggestion hang off this event.
        context.history().on('merge.maproulette', () => {
          onIdDataMergedRef.current()
        })
      }

      if (context?.map) {
        context.map().on('move.maproulette', () => {
          const center = context.map().center()
          const zoom = context.map().zoom()
          idViewportRef.current = { lat: center[1], lng: center[0], zoom }
        })
      }

      // Elements iD already had (a restored edit session) are handled here;
      // anything still downloading is picked up by the merge listener above.
      selectWhenLoadedRef.current = true
      onIdDataMergedRef.current()

      setIsLoading(false)
    } catch (err) {
      logger.error('Failed to initialize iD editor', { error: err })
      setIsLoading(false)
    }
  }

  // Lets the task panel put the editor back to the challenge's suggestion after
  // the mapper has undone or built on it. iD's own change event carries the
  // reset back out to the pending-edit list and the reset control.
  useEffect(() => {
    resetToSuggestionRef.current = () => {
      const context = idContextRef.current
      if (!context || suggestionSignatureRef.current === null) return
      restoreSuggestionCheckpoint(context, getIdGlobal(iframeRef.current?.contentWindow))
    }
    return () => {
      resetToSuggestionRef.current = null
    }
  }, [resetToSuggestionRef])

  // iD re-renders the map surface constantly, and any class we add to an
  // element is lost when it does — a full redraw, as happens when the map
  // crosses the zoom iD stops editing at, drops it for good. It always renders
  // an entity with its own id as a class, though, so the task's elements are
  // both made to glow and exempted from focus mode by id, which no redraw can
  // take away.
  useEffect(() => {
    const iframeDoc = iframeRef.current?.contentDocument
    if (!iframeDoc) return

    const STYLE_ID = 'mr-task-entities'
    let style = iframeDoc.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!style) {
      style = iframeDoc.createElement('style')
      style.id = STYLE_ID
      iframeDoc.head.appendChild(style)
    }

    style.textContent = osmEntityIds
      .flatMap((id) => [
        // The glow: iD's shadow path is drawn under the element itself and is
        // transparent until something makes it visible, which is how iD styles
        // its own selection and highlighting too.
        `.layer-osm path.shadow.${id},`,
        `.layer-osm g.${id} .shadow {`,
        '  stroke: #a855f7 !important; stroke-opacity: 0.75 !important;',
        '}',
        `.mr-focus-mode .layer-osm .${id},`,
        `.mr-focus-mode .layer-osm .${id} * {`,
        '  display: revert !important; opacity: 1 !important;',
        '}',
        // iD names a line's hit targets after its segments — `w123-0`, `w123-1`
        // — rather than after the way, so the touch layer needs a prefix match
        // as well as the plain id used for points and vertices. The trailing
        // hyphen keeps `w123-` from matching way `w1234`.
        `.mr-focus-mode .layer-touch .${id},`,
        `.mr-focus-mode .layer-touch [class*="${id}-"],`,
        `.mr-focus-mode .layer-touch .${id} * {`,
        '  pointer-events: auto !important;',
        '}',
      ])
      .join('\n')
    // `isLoading` flips false once the iframe has loaded, which is the first
    // point its document exists to write into.
  }, [osmEntityIds, isLoading])

  // Focus mode lives on a class on iD's own container, so it is applied here
  // rather than in the toggle handler — that way it is also applied when the
  // editor first loads with focus mode already on.
  useEffect(() => {
    if (isLoading) return
    const mapContainer = iframeRef.current?.contentDocument?.querySelector('.ideditor')
    mapContainer?.classList.toggle('mr-focus-mode', focusMode)
    markTaskEntities(osmEntityIds)
  }, [focusMode, isLoading, osmEntityIds, markTaskEntities])

  // Keep the editor in step with the bundle: a task joining brings its
  // suggestion with it, and a task leaving takes its suggestion back out. Only
  // the difference is acted on, so a mapper's own edits to elements that stay
  // in the bundle are untouched.
  useEffect(() => {
    const context = idContextRef.current
    const iframe = iframeRef.current
    if (isLoading || !context || !iframe) return

    // Whatever iD has already loaded is applied right here; the rest waits in
    // the queue for the download that brings it in.
    const reverted = tagFixQueueRef.current.sync(
      context,
      getIdGlobal(iframe.contentWindow),
      taskTagFixes
    )
    const settled = flushPendingTagFixes()

    // Withdrawing a suggestion moves the baseline just as applying one does.
    // A sync that did neither leaves it alone, so a bundle unchanged by a
    // refetch cannot swallow the mapper's edits into it.
    if (reverted.length > 0 && settled.length === 0) checkpointSuggestion()
  }, [taskTagFixes, isLoading, flushPendingTagFixes, checkpointSuggestion])

  const initialTaskIdRef = useRef(task.id)
  useEffect(() => {
    if (task.id === initialTaskIdRef.current) return
    const ctx = idContextRef.current
    if (!ctx?.map) return

    const [lng, lat] = task.location.coordinates
    ctx.map().centerZoom([lng, lat], 18)

    ctx.defaultChangesetComment(buildChangesetComment(challenge, task))

    // Select the new task's elements, now if iD has them and otherwise as soon
    // as the recentred map has downloaded them.
    selectWhenLoadedRef.current = true
    selectTaskEntitiesWhenLoaded()
    // Deliberately keyed on the task alone: re-running this on a challenge
    // refetch would yank the map back to the task's centre mid-edit.
  }, [task.id])

  useEffect(() => {
    return () => {
      const context = idContextRef.current
      if (!context) return
      context.history?.().on('change.maproulette', null)
      context.history?.().on('merge.maproulette', null)
      context.map?.().on('move.maproulette', null)
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
    <div className="size-full bg-white dark:bg-slate-950">
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
