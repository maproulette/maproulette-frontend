import { useExploreChallengesSearchContext } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import type { WorkOnCategory } from './filterTypes'

export const WorkOnFilter = () => {
  const { t } = useIntl()
  const { workOn, setWorkOn } = useExploreChallengesSearchContext()
  return (
    <div className="flex items-center gap-2">
      <Label className="whitespace-nowrap font-medium text-sm text-zinc-700 dark:text-zinc-300">
        {t({ id: 'exploreChallenges.filterBar.workOn.label', defaultMessage: 'Work on' })}
      </Label>
      <Select value={workOn} onValueChange={(value) => setWorkOn(value as WorkOnCategory)}>
        <SelectTrigger className="h-9 w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Anything">
            {t({ id: 'exploreChallenges.filterBar.workOn.anything', defaultMessage: 'Anything' })}
          </SelectItem>
          <SelectItem value="Roads / Pedestrian / Cycleways">
            {t({ id: 'exploreChallenges.filterBar.workOn.roadsPedestrianCycleways', defaultMessage: 'Roads / Pedestrian / Cycleways' }
            )}
          </SelectItem>
          <SelectItem value="Water">
            {t({ id: 'exploreChallenges.filterBar.workOn.water', defaultMessage: 'Water' })}
          </SelectItem>
          <SelectItem value="Points / Areas of Interest">
            {t({ id: 'exploreChallenges.filterBar.workOn.pointsAreasOfInterest', defaultMessage: 'Points / Areas of Interest' }
            )}
          </SelectItem>
          <SelectItem value="Buildings">
            {t({ id: 'exploreChallenges.filterBar.workOn.buildings', defaultMessage: 'Buildings' })}
          </SelectItem>
          <SelectItem value="Land Use / Administrative Boundaries">
            {t({ id: 'exploreChallenges.filterBar.workOn.landUseAdministrativeBoundaries', defaultMessage: 'Land Use / Administrative Boundaries' }
            )}
          </SelectItem>
          <SelectItem value="Transit">
            {t({ id: 'exploreChallenges.filterBar.workOn.transit', defaultMessage: 'Transit' })}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
