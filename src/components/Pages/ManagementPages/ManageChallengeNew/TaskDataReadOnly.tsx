import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useIntl } from '@/i18n'
import type { Challenge } from '@/types/Challenge'
import type { ChallengeFormValues } from './challengeFormSchema'

interface TaskDataReadOnlyProps {
  dataSource: ChallengeFormValues['dataSource']
  challenge?: Challenge
}

// Once a challenge exists, its task data source is shown read-only (matching
// MR3) — regenerating tasks from a new/updated source is done via Rebuild
// Tasks instead of editing it here.
export const TaskDataReadOnly = ({ dataSource, challenge }: TaskDataReadOnlyProps) => {
  const { t } = useIntl()

  return (
    <div className="space-y-4">
      {dataSource === 'overpass' && (
        <div className="space-y-2">
          <p className="font-medium text-sm">
            {t({ id: 'manageChallengeNew.challengeForm.overpassQueryReadOnlyLabel', defaultMessage: 'Overpass query' }
            )}
          </p>
          <Textarea
            readOnly
            value={challenge?.overpassQL ?? ''}
            className="min-h-32 resize-none bg-zinc-100 font-mono text-sm dark:bg-slate-800"
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t({ id: 'manageChallengeNew.challengeForm.overpassQueryReadOnlyBody', defaultMessage: 'Overpass queries cannot be edited here. Use Rebuild Tasks when managing your challenge to re-run the query and refresh your tasks.' }
            )}
          </p>
        </div>
      )}
      {dataSource === 'remoteGeoJSON' && (
        <div className="space-y-2">
          <p className="font-medium text-sm">{t({ id: 'common.geojsonUrl', defaultMessage: 'GeoJSON URL' })}</p>
          <Input
            readOnly
            value={challenge?.remoteGeoJson ?? ''}
            className="bg-zinc-100 dark:bg-slate-800"
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t({ id: 'manageChallengeNew.challengeForm.remoteGeoJSONReadOnlyBody', defaultMessage: 'Remote URLs cannot be edited here. Use Rebuild Tasks when managing your challenge to re-download the GeoJSON and refresh your tasks.' }
            )}
          </p>
        </div>
      )}
      {dataSource === 'localGeoJSON' && (
        <div className="space-y-2">
          <p className="font-medium text-sm">
            {t({ id: 'manageChallengeNew.challengeForm.localGeoJSONReadOnlyLabel', defaultMessage: 'Uploaded GeoJSON file' }
            )}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t({ id: 'manageChallengeNew.challengeForm.localGeoJSONReadOnlyBody', defaultMessage: "This challenge was built from an uploaded GeoJSON file, which can't be shown here. To replace it with fresh GeoJSON, use Rebuild Tasks when managing your challenge." }
            )}
          </p>
        </div>
      )}
    </div>
  )
}
