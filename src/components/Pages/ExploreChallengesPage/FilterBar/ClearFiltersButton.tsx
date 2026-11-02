import { X } from 'lucide-react'
import { useExploreChallengesSearchContext } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'

export const ClearFiltersButton = () => {
  const { t } = useIntl()
  const {
    difficulty,
    workOn,
    selectedCategories,
    global,
    locationOsmType,
    locationOsmId,
    keywords,
    handleClearFilters,
  } = useExploreChallengesSearchContext()

  const hasActiveFilters =
    difficulty !== 'Any' ||
    workOn !== 'Anything' ||
    selectedCategories.length > 0 ||
    global !== undefined ||
    (locationOsmType !== undefined && locationOsmId !== undefined) ||
    keywords !== undefined

  return (
    <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={!hasActiveFilters}>
      <X className="size-3.5" />
      {t({ id: 'exploreChallenges.filterBar.clearFilters', defaultMessage: 'Clear filters' })}
    </Button>
  )
}
