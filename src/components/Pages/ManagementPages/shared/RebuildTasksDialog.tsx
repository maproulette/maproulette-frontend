import { CircleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { DocsLink } from '@/components/shared/DocsLink'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useIntl } from '@/i18n'
import { getErrorMessage } from '@/lib/apiError'
import { logger } from '@/lib/logger'
import { bundledGeoJSONFile } from '@/lib/taskBundling'
import type { Challenge } from '@/types/Challenge'

type SourceType = 'local' | 'remote' | 'overpass'

// Infer a challenge's task source from which field is populated, falling back
// to a local upload — mirrors the detection used by the challenge form.
export const getChallengeSourceType = (challenge?: Challenge): SourceType => {
  if (challenge?.overpassQL) return 'overpass'
  if (challenge?.remoteGeoJson) return 'remote'
  return 'local'
}

// A line-by-line GeoJSON file holds one JSON object per line rather than a
// single JSON document, so the whole file won't parse but its first line will.
const detectLineByLine = (text: string): boolean => {
  const trimmed = text.trim()
  try {
    JSON.parse(trimmed)
    return false
  } catch {
    const firstLine = trimmed.split('\n').find((line) => line.trim().length > 0)
    if (!firstLine) return false
    try {
      JSON.parse(firstLine)
      return true
    } catch {
      return false
    }
  }
}

interface Props {
  challengeId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceType?: SourceType
  taskBundleIdProperty?: string | null
}

export const RebuildTasksDialog = ({
  challengeId,
  open,
  onOpenChange,
  sourceType,
  taskBundleIdProperty,
}: Props) => {
  const { t } = useIntl()
  const [removeUnmatched, setRemoveUnmatched] = useState(false)
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [dataOriginDate, setDataOriginDate] = useState('')

  const sourceIntro: Record<SourceType, string> = {
    overpass: t({ id: 'managementPages.rebuildTasksDialog.introOverpass', defaultMessage: 'Rebuilding will re-run the Overpass query and rebuild the challenge tasks with the latest data:' }
    ),
    remote: t({ id: 'managementPages.rebuildTasksDialog.introRemote', defaultMessage: "Rebuilding will re-download the GeoJSON data from the challenge's remote URL and rebuild the challenge tasks with the latest data:" }
    ),
    local: t({ id: 'managementPages.rebuildTasksDialog.introLocal', defaultMessage: 'Rebuilding will allow you to upload a new local file with the latest GeoJSON data and rebuild the challenge tasks:' }
    ),
  }

  const rebuild = api.challenge.useRebuildChallenge()
  const uploadGeoJSON = api.challenge.useUploadGeoJSON()
  const unmatchedId = useId()
  const fileId = useId()
  const dateId = useId()

  const isLocal = sourceType === 'local'
  const isPending = rebuild.isPending || uploadGeoJSON.isPending
  const canSubmit = !isPending && (!isLocal || localFile !== null)

  const reset = () => {
    setLocalFile(null)
    setDataOriginDate('')
    setRemoveUnmatched(false)
  }

  const handleSubmit = async () => {
    try {
      if (isLocal) {
        if (!localFile) return
        const text = await localFile.text()
        const bundleIdProperty = taskBundleIdProperty?.trim()
        await uploadGeoJSON.mutateAsync({
          challengeId,
          geoJSONFile: bundleIdProperty
            ? bundledGeoJSONFile(text, bundleIdProperty, localFile.name)
            : localFile,
          options: {
            lineByLine: bundleIdProperty ? true : detectLineByLine(text),
            removeUnmatched,
            dataOriginDate: dataOriginDate ? new Date(dataOriginDate).toISOString() : undefined,
            skipSnapshot: true,
          },
        })
      } else {
        await rebuild.mutateAsync({ challengeId, removeUnmatched, skipSnapshot: true })
      }
      toast.success(t({ id: 'common.tasksRebuilt', defaultMessage: 'Tasks rebuilt' }))
      reset()
      onOpenChange(false)
    } catch (error) {
      logger.error('Rebuild failed', { error })
      toast.error(
        await getErrorMessage(
          error,
          t({ id: 'common.rebuildTasksFailed', defaultMessage: 'Could not rebuild tasks' })
        )
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t({ id: 'managementPages.rebuildTasksDialog.title', defaultMessage: 'Rebuild Challenge Tasks' })}
          </DialogTitle>
          <DialogDescription>
            {sourceType
              ? sourceIntro[sourceType]
              : t({ id: 'managementPages.rebuildTasksDialog.descriptionDefault', defaultMessage: 'Rebuild the challenge tasks from its source data.' }
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              {t({ id: 'managementPages.rebuildTasksDialog.listUpdated', defaultMessage: 'Existing tasks included in the latest data will be updated' }
              )}
            </li>
            <li>
              {t({ id: 'managementPages.rebuildTasksDialog.listAdded', defaultMessage: 'New tasks will be added' }
              )}
            </li>
            <li>
              {t(
                {
                  id: 'managementPages.rebuildTasksDialog.listRemoveIncomplete',
                  defaultMessage:
                    'If you choose to first remove incomplete tasks (below), existing <strong>incomplete</strong> tasks will first be removed',
                },
                { strong: (chunks) => <strong>{chunks}</strong> }
              )}
            </li>
            <li>
              {t({ id: 'managementPages.rebuildTasksDialog.listKeepAsIs', defaultMessage: 'If you do not first remove incomplete tasks, they will be left as-is, possibly leaving tasks that have already been addressed outside of MapRoulette' }
              )}
            </li>
          </ul>

          <div className="flex items-start gap-3 rounded-lg bg-zinc-100 p-4 dark:bg-slate-800">
            <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
            <div className="space-y-2 text-amber-600 text-sm dark:text-amber-500">
              <p>
                {t({ id: 'managementPages.rebuildTasksDialog.warning', defaultMessage: 'Warning: Rebuilding can lead to task duplication if your feature ids are not setup properly or if matching up old data with new data is unsuccessful. This operation cannot be undone!' }
                )}
              </p>
              <DocsLink
                page="rebuildingChallengeTasks"
                icon={null}
                className="text-green-600 hover:text-green-700 dark:text-green-400"
              >
                {t({ id: 'managementPages.rebuildTasksDialog.learnMore', defaultMessage: 'Learn More' })}
              </DocsLink>
            </div>
          </div>

          {isLocal && (
            <div className="space-y-2">
              <Label htmlFor={fileId}>
                {t({ id: 'managementPages.rebuildTasksDialog.newGeoJsonFile', defaultMessage: 'New GeoJSON file' }
                )}
              </Label>
              <Input
                id={fileId}
                type="file"
                accept=".geojson,.json"
                onChange={(e) => setLocalFile(e.target.files?.[0] ?? null)}
              />
              <Label htmlFor={dateId}>
                {t({ id: 'managementPages.rebuildTasksDialog.dataOriginDate', defaultMessage: 'Date data was sourced (optional)' }
                )}
              </Label>
              <Input
                id={dateId}
                type="date"
                value={dataOriginDate}
                onChange={(e) => setDataOriginDate(e.target.value)}
              />
            </div>
          )}

          <label htmlFor={unmatchedId} className="flex items-center gap-2 text-sm">
            <Checkbox
              id={unmatchedId}
              checked={removeUnmatched}
              onCheckedChange={(c) => setRemoveUnmatched(c === true)}
            />
            {t({ id: 'managementPages.rebuildTasksDialog.removeIncomplete', defaultMessage: 'First remove incomplete tasks' }
            )}
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending
              ? t({ id: 'managementPages.rebuildTasksDialog.rebuilding', defaultMessage: 'Rebuilding…' })
              : t({ id: 'managementPages.rebuildTasksDialog.proceed', defaultMessage: 'Proceed' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
