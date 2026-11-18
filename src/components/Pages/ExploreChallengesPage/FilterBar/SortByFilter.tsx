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
import type { SortBy } from './filterTypes'

export const SortByFilter = () => {
  const { t } = useIntl()
  const { sortBy, setSortBy } = useExploreChallengesSearchContext()
  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
      <Label className="whitespace-nowrap font-medium text-fg text-sm">
        {t({ id: 'exploreChallenges.filterBar.sortBy.label', defaultMessage: 'Sort by' })}
      </Label>
      <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
        <SelectTrigger className="h-9 w-full md:w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            {t({
              id: 'exploreChallenges.filterBar.sortBy.recommended',
              defaultMessage: 'Recommended',
            })}
          </SelectItem>
          <SelectItem value="popularity">
            {t({ id: 'common.popular', defaultMessage: 'Popular' })}
          </SelectItem>
          <SelectItem value="created">
            {t({ id: 'common.newest', defaultMessage: 'Newest' })}
          </SelectItem>
          <SelectItem value="oldest">
            {t({ id: 'exploreChallenges.filterBar.sortBy.oldest', defaultMessage: 'Oldest' })}
          </SelectItem>
          <SelectItem value="name">{t({ id: 'common.name', defaultMessage: 'Name' })}</SelectItem>
          <SelectItem value="difficulty">
            {t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
