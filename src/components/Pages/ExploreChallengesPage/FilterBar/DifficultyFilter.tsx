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
import { getDifficultyLabel } from '@/lib/difficultyLevelData'
import type { DifficultyLevel } from './filterTypes'
import { difficultyMap } from './filterUtils'

export const DifficultyFilter = () => {
  const { t } = useIntl()
  const { difficulty, setDifficulty } = useExploreChallengesSearchContext()
  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
      <Label className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
        {t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}
      </Label>
      <Select value={difficulty} onValueChange={(value) => setDifficulty(value as DifficultyLevel)}>
        <SelectTrigger className="h-9 w-full md:w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Any">
            {t({ id: 'exploreChallenges.filterBar.difficulty.any', defaultMessage: 'Any' })}
          </SelectItem>
          <SelectItem value="Easy">
            {getDifficultyLabel(t, difficultyMap.Easy as number)}
          </SelectItem>
          <SelectItem value="Normal">
            {getDifficultyLabel(t, difficultyMap.Normal as number)}
          </SelectItem>
          <SelectItem value="Expert">
            {getDifficultyLabel(t, difficultyMap.Expert as number)}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
