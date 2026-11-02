import bbox from '@turf/bbox'
import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { useOptionalTaskEditMapContext } from '@/components/Pages/TaskEditPage/TaskMap/TaskEditMapContext'
import {
  formatOsmEntities,
  parseOsmFeaturesFromTask,
} from '@/components/TaskInfoPanel/taskUtils/osmUtils'
import { useAuthContext } from '@/contexts/AuthContext'
import { editorOptions } from '@/data/account.json'
import { useIntl } from '@/i18n'
import { buildChangesetComment } from '@/lib/changesetComment'
import { isTagFixTask } from '@/lib/cooperativeWork'
import {
  editorBackgroundParam,
  editorImageryForStyle,
  josmImageryCommand,
} from '@/lib/editorImagery'
import { JOSM_HOST, sendJosmCommands } from '@/lib/josmRemoteControl'
import { logger } from '@/lib/logger'
import { josmImportUrl, referenceLayers } from '@/lib/taskAttachments'
import type { Bbox2D } from '@/types/Map'
import type { Task } from '@/types/Task'
import { useChallengeContext } from '../contexts/ChallengeContext'
import { useTaskBundleContext } from '../contexts/TaskBundleContext'

// Editor option values (mirrors MR3 server-side constants)
export const EDITOR = {
  id: 0,
  josm: 1,
  josmLayer: 2,
  level0: 3,
  josmFeatures: 4,
  rapid: 5,
} as const

// JOSM fetches attachment data itself, so it needs an absolute backend URL.
const apiBaseUrl = window.env.VITE_API_BASE_URL || window.location.origin

const idEditorUrl = window.env.VITE_ID_EDITOR_SERVER_URL || 'https://www.openstreetmap.org/edit'
const rapidEditorUrl = window.env.VITE_RAPID_EDITOR_SERVER_URL || 'https://rapideditor.org/edit'
const level0EditorUrl =
  window.env.VITE_LEVEL0_EDITOR_SERVER_URL || 'https://level0.osmz.ru/index.php'

/**
 * Build a [west, south, east, north] bbox covering all the given tasks' geometries.
 */
const computeBboxForTasks = (tasks: Task[]): Bbox2D => {
  const features = tasks.flatMap((t) => t.geometries.features)
  return bbox({ type: 'FeatureCollection', features }) as Bbox2D
}

const bboxCenter = ([west, south, east, north]: Bbox2D): [number, number] => [
  (west + east) / 2,
  (south + north) / 2,
]

const DEFAULT_EDITOR_ZOOM = 18

/**
 * Opening a task in an external editor, shared by the editor button and the
 * editor keyboard shortcuts so a key and a click do exactly the same thing.
 */
export const useEditorLaunch = (task: Task) => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const { challenge } = useChallengeContext()
  const { activeBundle } = useTaskBundleContext()
  const bundledTaskIds = (activeBundle?.taskIds ?? []).filter((id) => id !== task.id)
  const { data: bundledTasks } = api.task.getTasks(bundledTaskIds)
  const { openIdEditor } = useEditorContext()
  const taskMap = useOptionalTaskEditMapContext()
  const taskMapRef = useRef(taskMap)
  taskMapRef.current = taskMap
  const isTagFix = isTagFixTask(task)

  // Get current default editor (default to iD if not set)
  const defaultEditor = user?.settings?.defaultEditor ?? EDITOR.id

  const openEditor = useCallback(
    (editorValue: number) => {
      try {
        const tasks: Task[] = [task, ...(bundledTasks ?? [])]
        const mapView = taskMapRef.current?.mapLoaded ? taskMapRef.current : null
        const taskBounds =
          mapView && tasks.length === 1 ? mapView.mapBounds : computeBboxForTasks(tasks)
        const [lng, lat] =
          mapView || tasks.length > 1 ? bboxCenter(taskBounds) : task.location.coordinates
        const zoom = mapView ? Math.round(mapView.mapZoom * 100) / 100 : DEFAULT_EDITOR_ZOOM
        const presets = challenge?.presets?.length
          ? `presets=${encodeURIComponent(challenge.presets.join(','))}`
          : null
        const imagery = editorImageryForStyle(mapView?.mapRef.current?.getMap().getStyle())

        const checkinComment = buildChangesetComment(challenge, task)
        const checkinSource = challenge?.checkinSource ?? ''
        const layerName = activeBundle
          ? `MR Bundle ${task.id} (${tasks.length} tasks)`
          : `MR Task ${task.id}`

        let editorUrl = ''
        let josmCommands: string[] = []

        switch (editorValue) {
          case EDITOR.id: {
            // External iD goes through OSM.org's /edit wrapper, which only
            // understands the legacy per-type query params: node=ID, way=ID,
            // relation=ID. The hash is forwarded to the iD iframe untouched, so
            // map/comment/source ride along there.
            const selectionParts: string[] = []
            for (const t of tasks) {
              for (const f of parseOsmFeaturesFromTask(t)) {
                selectionParts.push(`${f.type}=${f.id}`)
              }
            }
            const hashParts = [`map=${zoom}/${lat}/${lng}`]
            if (checkinComment) hashParts.push(`comment=${encodeURIComponent(checkinComment)}`)
            if (checkinSource) hashParts.push(`source=${encodeURIComponent(checkinSource)}`)
            if (imagery) hashParts.push(editorBackgroundParam(imagery))
            if (presets) hashParts.push(presets)
            const query = selectionParts.length ? `&${selectionParts.join('&')}` : ''
            editorUrl = `${idEditorUrl}?editor=id${query}#${hashParts.join('&')}`
            break
          }

          case EDITOR.josm:
          case EDITOR.josmLayer: {
            const bounds = taskBounds
            if (!bounds) {
              toast.error(
                t(
                  'taskEditPage.taskActions.editorButton.noBounds',
                  undefined,
                  'Task bounds not available'
                )
              )
              return
            }
            const [west, south, east, north] = bounds
            const selection = formatOsmEntities(tasks, { abbreviated: false })
            const parts = [
              `left=${west}`,
              `right=${east}`,
              `top=${north}`,
              `bottom=${south}`,
              `new_layer=${editorValue === EDITOR.josmLayer ? 'true' : 'false'}`,
              `layer_name=${encodeURIComponent(layerName)}`,
              `changeset_comment=${encodeURIComponent(checkinComment)}`,
              `changeset_source=${encodeURIComponent(checkinSource)}`,
            ]
            if (selection) parts.push(`select=${selection}`)
            josmCommands = [
              `${JOSM_HOST}load_and_zoom?${parts.join('&')}`,
              ...tasks.flatMap((t) =>
                referenceLayers(t).map((attachment) =>
                  josmImportUrl(JOSM_HOST, apiBaseUrl, t.id, attachment)
                )
              ),
            ]
            break
          }

          case EDITOR.josmFeatures: {
            // load_object: select & download the specific OSM elements
            const selection = formatOsmEntities(tasks, { abbreviated: false })
            if (!selection) {
              toast.error(
                t(
                  'taskEditPage.taskActions.editorButton.noOsmFeatures',
                  undefined,
                  'Task has no OSM feature IDs to load'
                )
              )
              return
            }
            const [west, south, east, north] = taskBounds
            const boundsParams = `left=${west}&right=${east}&top=${north}&bottom=${south}`
            const parts = [
              boundsParams,
              'new_layer=true',
              `layer_name=${encodeURIComponent(layerName)}`,
              `changeset_comment=${encodeURIComponent(checkinComment)}`,
              `changeset_source=${encodeURIComponent(checkinSource)}`,
              `objects=${selection}`,
            ]
            josmCommands = [
              `${JOSM_HOST}load_object?${parts.join('&')}`,
              `${JOSM_HOST}zoom?${boundsParams}`,
            ]
            break
          }

          case EDITOR.level0: {
            const selection = formatOsmEntities(tasks, { abbreviated: true })
            const parts = [`center=${lat},${lng}`]
            if (checkinComment) parts.push(`comment=${encodeURIComponent(checkinComment)}`)
            if (selection) parts.push(`url=${selection}`)
            editorUrl = `${level0EditorUrl}?${parts.join('&')}`
            break
          }

          case EDITOR.rapid: {
            // External Rapid editor. Build the hash by hand: URLSearchParams
            // percent-encodes the slashes in `map=zoom/lat/lng`, which Rapid
            // can't parse — so it would silently ignore the map and selection.
            const selection = formatOsmEntities(tasks, { abbreviated: true })
            const parts: string[] = []
            if (selection) parts.push(`id=${selection}`)
            if (checkinComment) parts.push(`comment=${encodeURIComponent(checkinComment)}`)
            if (checkinSource) parts.push(`source=${encodeURIComponent(checkinSource)}`)
            if (imagery) parts.push(editorBackgroundParam(imagery))
            if (presets) parts.push(presets)
            parts.push(`map=${zoom}/${lat}/${lng}`)
            if (challenge?.datasetUrl)
              parts.push(`data=${encodeURIComponent(challenge.datasetUrl)}`)
            editorUrl = `${rapidEditorUrl}#${parts.join('&')}`
            break
          }

          default: {
            const selection = formatOsmEntities(tasks, { abbreviated: true })
            const query = selection ? `&id=${selection}` : ''
            editorUrl = `${idEditorUrl}?editor=id${query}#map=${zoom}/${lat}/${lng}`
          }
        }

        const editorLabel =
          editorOptions.find((opt) => opt.value === editorValue)?.label ||
          t('taskEditPage.taskActions.editorButton.editorFallback', undefined, 'editor')
        const notifyOpened = () =>
          toast.success(
            t(
              'taskEditPage.taskActions.editorButton.openingTaskIn',
              { editor: editorLabel },
              'Opening task in {editor}'
            )
          )

        if (josmCommands.length > 0) {
          if (imagery) josmCommands.push(josmImageryCommand(JOSM_HOST, imagery))
          void sendJosmCommands(josmCommands).then((opened) => {
            if (opened) {
              notifyOpened()
            } else {
              toast.error(
                t(
                  'taskEditPage.taskActions.editorButton.josmNoResponse',
                  undefined,
                  'OSM remote control did not respond. Do you have JOSM running with Remote Control enabled?'
                )
              )
            }
          })
        } else if (editorUrl) {
          window.open(editorUrl, '_blank', 'noopener,noreferrer')
          notifyOpened()
        }
      } catch (error) {
        logger.error('Error opening editor', { error })
        toast.error(
          t('taskEditPage.taskActions.editorButton.openFailed', undefined, 'Failed to open editor')
        )
      }
    },
    [task, bundledTasks, challenge, activeBundle, t]
  )

  const openDefaultEditor = useCallback(() => {
    // A tag-fix challenge proposes tag changes that MapRoulette can only apply
    // for the mapper inside the embedded iD editor, so those tasks open there
    // whatever the mapper's usual editor is. Picking an editor explicitly still
    // does what it says.
    if (isTagFix) {
      openIdEditor()
      return
    }
    openEditor(defaultEditor === -1 ? EDITOR.id : defaultEditor)
  }, [isTagFix, openIdEditor, openEditor, defaultEditor])

  return { openEditor, openDefaultEditor, defaultEditor, isTagFix }
}
