import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import type { ExportFormat } from '@/api/challenge/exports'
import { DocsLink } from '@/components/shared/DocsLink'
import { binaryToTaskPropertySearch } from '@/components/shared/TaskPropertyQueryBuilder/taskPropertySearch'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import { exportTimezoneOptions, localTimezoneOffset } from '@/lib/exportTimezones'
import { logger } from '@/lib/logger'
import { useExplorerContext } from './ChallengeTasksExplorerContext'

/**
 * Downloads this challenge's tasks, in CSV or GeoJSON, with the task table's
 * current filters applied and timestamps rendered in a chosen timezone.
 */
export const ExportTasksButton = () => {
  const { t } = useIntl()
  const { challengeId, challengeName, statusEnabled, priorityEnabled, propertyRule } =
    useExplorerContext()
  const exportMutation = api.challenge.useExportChallenge()
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [timezone, setTimezone] = useState(localTimezoneOffset)

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        challengeId,
        challengeName,
        format,
        timezone,
        taskStatuses: Object.keys(statusEnabled)
          .filter((key) => statusEnabled[Number(key)])
          .map(Number),
        priorities: Object.keys(priorityEnabled)
          .filter((key) => priorityEnabled[Number(key)])
          .map(Number),
        taskPropertySearch: binaryToTaskPropertySearch(propertyRule),
      })
      setOpen(false)
    } catch (error) {
      logger.error('Challenge export failed', { challengeId, format, error })
      toast.error(
        t('manageChallengeDetail.export.failed', undefined, 'Could not export this challenge')
      )
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4" />
        {t('manageChallengeDetail.export.button', undefined, 'Export')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {t('manageChallengeDetail.export.title', undefined, 'Export tasks')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'manageChallengeDetail.export.description',
                undefined,
                'The filters currently applied to the task table are applied to the export as well.'
              )}{' '}
              <DocsLink page="exportingChallengeData" icon={null}>
                {t('manageChallengeDetail.export.docsLink', undefined, 'About challenge exports')}
              </DocsLink>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="font-medium text-sm">
                {t('manageChallengeDetail.export.formatLabel', undefined, 'Format')}
              </legend>
              <RadioGroup
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
                className="gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="csv" id="export-csv" />
                  <Label htmlFor="export-csv" className="font-normal">
                    {t(
                      'manageChallengeDetail.export.formatCsv',
                      undefined,
                      'CSV — one row per task'
                    )}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="geojson" id="export-geojson" />
                  <Label htmlFor="export-geojson" className="font-normal">
                    {t(
                      'manageChallengeDetail.export.formatGeoJSON',
                      undefined,
                      'GeoJSON — task geometries and properties'
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="export-timezone">
                {t('manageChallengeDetail.export.timezoneLabel', undefined, 'Timestamp timezone')}
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="export-timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {exportTimezoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel', undefined, 'Cancel')}
            </Button>
            <Button onClick={handleExport} disabled={exportMutation.isPending}>
              {exportMutation.isPending
                ? t('manageChallengeDetail.export.preparing', undefined, 'Preparing...')
                : t('manageChallengeDetail.export.confirm', undefined, 'Download')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
