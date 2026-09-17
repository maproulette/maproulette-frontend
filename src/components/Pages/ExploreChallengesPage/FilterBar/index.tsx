import { useIntl } from '@/i18n'
import { useExploreChallengesSearchContext } from '../contexts/ExploreChallengesSearchContext'
import { ClearFiltersButton } from './ClearFiltersButton'
import { DifficultyFilter } from './DifficultyFilter'
import { GlobalToggle } from './GlobalMapToggles'
import { LocationSearchFilter } from './LocationSearchFilter'
import { SortByFilter } from './SortByFilter'
import { ViewModeToggle } from './ViewModeToggle'
import { WorkOnFilter } from './WorkOnFilter'

/**
 * Filter controls for the explore page, sitting above the results.
 *
 * They narrow the *list* of challenges, never the map: the map shows all
 * available work, which is what lets its tiles be a pure function of their
 * coordinates and come straight from the pre-computed pyramid. So alongside the
 * map they are hidden, and the provider leaves them out of the query too -- a
 * filtered list next to an unfiltered map reads as a bug, whether or not the
 * controls that caused it are on screen.
 *
 * Location search and sort survive into the map view: the first moves the map
 * and outlines the place rather than narrowing anything, the second only orders
 * results that are already there.
 *
 * Writing the filter state back to the URL is the provider's job, not this
 * component's.
 */
export const FilterBar = () => {
  const { t } = useIntl()
  const { viewMode } = useExploreChallengesSearchContext()
  const showListFilters = viewMode !== 'grid-map'

  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      {showListFilters && (
        <span className="shrink-0 font-medium text-sm text-zinc-600 dark:text-zinc-300">
          {t('exploreChallenges.filterBar.title', undefined, 'Challenge List Filters')}
        </span>
      )}
      <LocationSearchFilter />
      <SortByFilter />
      {showListFilters && (
        <>
          <WorkOnFilter />
          <DifficultyFilter />
          <GlobalToggle />
          <ClearFiltersButton />
        </>
      )}
      <div className="ml-auto">
        <ViewModeToggle />
      </div>
    </div>
  )
}
