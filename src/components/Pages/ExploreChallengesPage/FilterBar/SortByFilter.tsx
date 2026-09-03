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
        {t('exploreChallenges.filterBar.sortBy.label', undefined, 'Sort by')}
      </Label>
      <Select
        value={sortBy || 'name'}
        onValueChange={(value) => setSortBy(value as ExtendedFindParamsSortBy)}
      >
        <SelectTrigger className="h-9 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">{t('common.name', undefined, 'Name')}</SelectItem>
          <SelectItem value="created">{t('common.newest', undefined, 'Newest')}</SelectItem>
          <SelectItem value="modified">
            {t('exploreChallenges.filterBar.sortBy.oldest', undefined, 'Oldest')}
          </SelectItem>
          <SelectItem value="popularity">{t('common.popular', undefined, 'Popular')}</SelectItem>
          <SelectItem value="difficulty">
            {t('common.difficulty', undefined, 'Difficulty')}
          </SelectItem>
          <SelectItem value="featured">{t('common.featured', undefined, 'Featured')}</SelectItem>
          <SelectItem value="tag_fix">{t('common.tagFix', undefined, 'Tag Fix')}</SelectItem>
          <SelectItem value="cooperative">
            {t('common.cooperative', undefined, 'Cooperative')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
