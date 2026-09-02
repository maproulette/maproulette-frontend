import bbox from '@turf/bbox'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import {
  formatOsmEntities,
  parseOsmFeaturesFromTask,
} from '@/components/TaskInfoPanel/taskUtils/osmUtils'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
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

interface EditorButtonProps {
  task: Task
}

// Editor option values (mirrors MR3 server-side constants)
const ID = 0
const JOSM = 1
const JOSM_LAYER = 2
const LEVEL0 = 3
const JOSM_FEATURES = 4
const RAPID = 5

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

export const EditorButton = ({ task }: EditorButtonProps) => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const { challenge } = useChallengeContext()
  const { activeBundle } = useTaskBundleContext()
  const bundledTaskIds = (activeBundle?.taskIds ?? []).filter((id) => id !== task.id)
  const { data: bundledTasks } = api.task.getTasks(bundledTaskIds)
  const [isSaving, setIsSaving] = useState(false)
  const { openIdEditor } = useEditorContext()
  const isTagFix = isTagFixTask(task)

  // Get current default editor (default to iD if not set)
  const defaultEditor = user?.settings?.defaultEditor ?? 0
  const currentEditorOption =
    editorOptions.find((opt) => opt.value === defaultEditor) || editorOptions[1] // Default to iD

  // The primary button opens embedded iD for a tag fix, so it must say so
  // rather than advertising the mapper's usual editor.
  const primaryEditorLabel = isTagFix
    ? t('taskEditPage.taskActions.editorButton.editInId', undefined, 'Edit in iD')
    : currentEditorOption.label

  const updateEditorMutation = api.user.useUpdateUserSettings()

  const openEditor = (editorValue: number) => {
    try {
      const tasks: Task[] = [task, ...(bundledTasks ?? [])]
      const [lng, lat] = task.location.coordinates
      const zoom = 18

      const checkinComment = buildChangesetComment(challenge, task.id)
      const checkinSource = challenge?.checkinSource ?? ''
      const layerName = activeBundle
        ? `MR Bundle ${task.id} (${tasks.length} tasks)`
        : `MR Task ${task.id}`

      let editorUrl = ''

      switch (editorValue) {
        case ID: {
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

        case JOSM:
        case JOSM_LAYER: {
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
            `new_layer=${editorValue === JOSM_LAYER ? 'true' : 'false'}`,
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

        case JOSM_FEATURES: {
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

        case LEVEL0: {
          const selection = formatOsmEntities(tasks, { abbreviated: false })
          const parts = [`center=${lat},${lng}`]
          if (checkinComment) parts.push(`comment=${encodeURIComponent(checkinComment)}`)
          if (selection) parts.push(`url=${selection}`)
          editorUrl = `https://level0.osmz.ru/?${parts.join('&')}`
          break
        }

        case RAPID: {
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
        if (editorValue === JOSM || editorValue === JOSM_LAYER) {
          const layers = tasks.flatMap((t) =>
            referenceLayers(t).map((attachment) => ({ taskId: t.id, attachment }))
          )
          for (const { taskId, attachment } of layers) {
            const importUrl = josmImportUrl(JOSM_HOST, apiBaseUrl, taskId, attachment)
            fetch(importUrl, { mode: 'no-cors' }).catch((error) => {
              logger.warn('Failed to send reference layer to JOSM', {
                taskId,
                attachmentId: attachment.id,
                error: String(error),
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
      logger.error('Error opening editor', { error: String(error) })
      toast.error(
        t('taskEditPage.taskActions.editorButton.openFailed', undefined, 'Failed to open editor')
      )
    }
  }

  const handleOpenEditor = () => {
    // A tag-fix challenge proposes tag changes that MapRoulette can only apply
    // for the mapper inside the embedded iD editor, so those tasks open there
    // whatever the mapper's usual editor is. Picking an editor explicitly from
    // the dropdown still does what it says.
    if (isTagFix) {
      openIdEditor()
      return
    }
    openEditor(defaultEditor === -1 ? 0 : defaultEditor)
  }

  const handleSetDefaultEditor = async (editorValue: number) => {
    if (editorValue === defaultEditor || !user?.id) {
      return
    }

    setIsSaving(true)
    try {
      await updateEditorMutation.mutateAsync(
        {
          userId: user.id,
          settings: {
            ...user.settings,
            defaultEditor: editorValue,
          },
        },
        {
          onSuccess: () =>
            toast.success(
              t(
                'taskEditPage.taskActions.editorButton.defaultUpdated',
                undefined,
                'Default editor updated'
              )
            ),
          onError: () =>
            toast.error(
              t(
                'taskEditPage.taskActions.editorButton.defaultUpdateFailed',
                undefined,
                'Failed to update default editor'
              )
            ),
        }
      )
    } catch (error) {
      logger.error('Error setting default editor', { error: String(error) })
    } finally {
      setIsSaving(false)
    }
  }

  // Get short label for mobile
  const getShortLabel = (label: string) => {
    if (label.includes('iD'))
      return t('taskEditPage.taskActions.editorButton.short.id', undefined, 'iD')
    if (label.includes('JOSM')) {
      if (label.includes('new layer'))
        return t('taskEditPage.taskActions.editorButton.short.josmLayer', undefined, 'JOSM Layer')
      if (label.includes('features'))
        return t(
          'taskEditPage.taskActions.editorButton.short.josmFeatures',
          undefined,
          'JOSM Features'
        )
      return t('taskEditPage.taskActions.editorButton.short.josm', undefined, 'JOSM')
    }
    if (label.includes('level0'))
      return t('taskEditPage.taskActions.editorButton.short.level0', undefined, 'Level0')
    if (label.includes('Rapid'))
      return t('taskEditPage.taskActions.editorButton.short.rapid', undefined, 'Rapid')
    return label
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <Button
          size="sm"
          onClick={handleOpenEditor}
          className="gap-2 rounded-r-none rounded-l-full border-r border-r-background/20"
          variant="default"
          title={t(
            'taskEditPage.taskActions.editorButton.openTaskIn',
            { editor: primaryEditorLabel },
            'Open task in {editor}'
          )}
          disabled={isSaving || updateEditorMutation.isPending}
        >
          <span className="hidden sm:inline">{primaryEditorLabel}</span>
          <span className="sm:hidden">{getShortLabel(primaryEditorLabel)}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="default"
              className="rounded-r-full rounded-l-none px-2"
              title={t(
                'taskEditPage.taskActions.editorButton.changeDefault',
                undefined,
                'Change default editor'
              )}
              disabled={isSaving || updateEditorMutation.isPending}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {t(
                'taskEditPage.taskActions.editorButton.setDefaultEditor',
                undefined,
                'Set Default Editor:'
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {editorOptions
              .filter((opt) => opt.value !== -1) // Exclude "None" option
              .map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSetDefaultEditor(option.value)}
                  className={
                    option.value === defaultEditor
                      ? 'bg-zinc-100 font-medium dark:bg-slate-800'
                      : ''
                  }
                  disabled={isSaving || updateEditorMutation.isPending}
                >
                  <span className="mr-2">{option.value === defaultEditor ? '✓' : ' '}</span>
                  {option.label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
