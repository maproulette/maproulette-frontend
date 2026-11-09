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
import type { ExtendedFindParamsSortBy } from '@/types/Challenge'

export const SortByFilter = () => {
  const { t } = useIntl()
  const { sortBy, setSortBy } = useExploreChallengesSearchContext()
  return (
    <div className="flex items-center gap-2">
      <Label className="whitespace-nowrap font-medium text-sm text-zinc-700 dark:text-zinc-300">
        {t({ id: 'exploreChallenges.filterBar.sortBy.label', defaultMessage: 'Sort by' })}
      </Label>
      <Select
        value={sortBy}
        onValueChange={(value) => setSortBy(value as ExtendedFindParamsSortBy)}
      >
        <SelectTrigger className="h-9 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            {t({ id: 'exploreChallenges.filterBar.sortBy.default', defaultMessage: 'Default' })}
          </SelectItem>
          <SelectItem value="name">{t({ id: 'common.name', defaultMessage: 'Name' })}</SelectItem>
          <SelectItem value="created">
            {t({ id: 'common.newest', defaultMessage: 'Newest' })}
          </SelectItem>
          <SelectItem value="oldest">
            {t({ id: 'exploreChallenges.filterBar.sortBy.oldest', defaultMessage: 'Oldest' })}
          </SelectItem>
          <SelectItem value="popularity">
            {t({ id: 'common.popular', defaultMessage: 'Popular' })}
          </SelectItem>
          <SelectItem value="difficulty">
            {t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}
          </SelectItem>
          <SelectItem value="featured">
            {t({ id: 'common.featured', defaultMessage: 'Featured' })}
          </SelectItem>
          <SelectItem value="tag_fix">
            {t({ id: 'common.tagFix', defaultMessage: 'Tag Fix' })}
          </SelectItem>
          <SelectItem value="cooperative">
            {t({ id: 'common.cooperative', defaultMessage: 'Cooperative' })}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
