import bbox from '@turf/bbox'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import {
  formatOsmEntities,
  parseOsmFeaturesFromTask,
} from '@/components/TaskInfoPanel/taskUtils/osmUtils'
import { useAuthContext } from '@/contexts/AuthContext'
import { editorOptions } from '@/data/account.json'
import { useIntl } from '@/i18n'
import { buildChangesetComment } from '@/lib/changesetComment'
import { isTagFixTask } from '@/lib/cooperativeWork'
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

const JOSM_HOST = 'http://127.0.0.1:8111/'

// JOSM fetches attachment data itself, so it needs an absolute backend URL.
const apiBaseUrl = window.env.VITE_API_BASE_URL || window.location.origin

/**
 * Build a [west, south, east, north] bbox covering all the given tasks' geometries.
 */
const computeBboxForTasks = (tasks: Task[]): Bbox2D => {
  const features = tasks.flatMap((t) => t.geometries.features)
  return bbox({ type: 'FeatureCollection', features }) as Bbox2D
}

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
  const isTagFix = isTagFixTask(task)

  // Get current default editor (default to iD if not set)
  const defaultEditor = user?.settings?.defaultEditor ?? EDITOR.id

  const openEditor = useCallback(
    (editorValue: number) => {
      try {
        const tasks: Task[] = [task, ...(bundledTasks ?? [])]
        const [lng, lat] = task.location.coordinates
        const zoom = 18

        const checkinComment = buildChangesetComment(challenge, task)
        const checkinSource = challenge?.checkinSource ?? ''
        const layerName = activeBundle
          ? `MR Bundle ${task.id} (${tasks.length} tasks)`
          : `MR Task ${task.id}`

        let editorUrl = ''

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
            const query = selectionParts.length ? `&${selectionParts.join('&')}` : ''
            editorUrl = `https://www.openstreetmap.org/edit?editor=id${query}#${hashParts.join('&')}`
            break
          }

          case EDITOR.josm:
          case EDITOR.josmLayer: {
            const bounds = computeBboxForTasks(tasks)
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
            editorUrl = `${JOSM_HOST}load_and_zoom?${parts.join('&')}`
            toast.info(
              t(
                'taskEditPage.taskActions.editorButton.josmRemoteControlHint',
                undefined,
                'Make sure JOSM is running with remote control enabled'
              )
            )
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
            const bounds = computeBboxForTasks(tasks)
            const parts = [
              'new_layer=true',
              `layer_name=${encodeURIComponent(layerName)}`,
              `changeset_comment=${encodeURIComponent(checkinComment)}`,
              `changeset_source=${encodeURIComponent(checkinSource)}`,
              `objects=${selection}`,
            ]
            if (bounds) {
              const [west, south, east, north] = bounds
              parts.unshift(`left=${west}`, `right=${east}`, `top=${north}`, `bottom=${south}`)
            }
            editorUrl = `${JOSM_HOST}load_object?${parts.join('&')}`
            toast.info(
              t(
                'taskEditPage.taskActions.editorButton.josmRemoteControlHint',
                undefined,
                'Make sure JOSM is running with remote control enabled'
              )
            )
            break
          }

          case EDITOR.level0: {
            const selection = formatOsmEntities(tasks, { abbreviated: false })
            const parts = [`center=${lat},${lng}`]
            if (checkinComment) parts.push(`comment=${encodeURIComponent(checkinComment)}`)
            if (selection) parts.push(`url=${selection}`)
            editorUrl = `https://level0.osmz.ru/?${parts.join('&')}`
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
            parts.push(`map=${zoom}/${lat}/${lng}`)
            editorUrl = `https://rapideditor.org/edit#${parts.join('&')}`
            break
          }

          default: {
            const selection = formatOsmEntities(tasks, { abbreviated: true })
            const query = selection ? `&id=${selection}` : ''
            editorUrl = `https://www.openstreetmap.org/edit?editor=id${query}#map=${zoom}/${lat}/${lng}`
          }
        }

        if (editorUrl) {
          window.open(editorUrl, '_blank', 'noopener,noreferrer')

          // Reference layers attached to the task are sent to JOSM as extra
          // layers once the task itself has been loaded. They are supplementary,
          // so a failure here is logged rather than surfaced — the mapper still
          // has the task open.
          if (editorValue === EDITOR.josm || editorValue === EDITOR.josmLayer) {
            const layers = tasks.flatMap((t) =>
              referenceLayers(t).map((attachment) => ({ taskId: t.id, attachment }))
            )
            for (const { taskId, attachment } of layers) {
              const importUrl = josmImportUrl(JOSM_HOST, apiBaseUrl, taskId, attachment)
              fetch(importUrl, { mode: 'no-cors' }).catch((error) => {
                logger.warn('Failed to send reference layer to JOSM', {
                  taskId,
                  attachmentId: attachment.id,
                  error,
                })
              })
            }
          }
          toast.success(
            t(
              'taskEditPage.taskActions.editorButton.openingTaskIn',
              {
                editor:
                  editorOptions.find((opt) => opt.value === editorValue)?.label ||
                  t('taskEditPage.taskActions.editorButton.editorFallback', undefined, 'editor'),
              },
              'Opening task in {editor}'
            )
          )
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
