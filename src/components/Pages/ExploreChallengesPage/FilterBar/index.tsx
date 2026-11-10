import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useIsDesktopLayoutContext } from '@/contexts/LayoutContext'
import { useIntl } from '@/i18n'
import { useExploreChallengesSearchContext } from '../contexts/ExploreChallengesSearchContext'
import { CategorizeFilter } from './CategorizeFilter'
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
  const {
    viewMode,
    workOn,
    difficulty,
    selectedCategories,
    global,
    locationOsmType,
    locationOsmId,
  } = useExploreChallengesSearchContext()
  const isDesktop = useIsDesktopLayoutContext()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const showListFilters = viewMode !== 'grid-map'

  if (!isDesktop) {
    const hasLocation = locationOsmType !== undefined && locationOsmId !== undefined
    const activeCount = showListFilters
      ? [
          hasLocation,
          workOn !== 'Anything',
          difficulty !== 'Any',
          selectedCategories.length > 0,
          global !== undefined,
        ].filter(Boolean).length
      : Number(hasLocation)

    return (
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" aria-expanded={filtersOpen}>
              <SlidersHorizontal className="size-3.5" />
              {t(
                {
                  id: 'exploreChallenges.filterBar.filtersToggle',
                  defaultMessage:
                    '{count, plural, =0 {Filters} one {Filters (#)} other {Filters (#)}}',
                },
                { count: activeCount }
              )}
            </Button>
          </CollapsibleTrigger>
          <div className="ml-auto">
            <ViewModeToggle />
          </div>
        </div>
        <CollapsibleContent className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <LocationSearchFilter />
          </div>
          <SortByFilter />
          {showListFilters && (
            <>
              <WorkOnFilter />
              <DifficultyFilter />
              <CategorizeFilter />
              <div className="col-span-2 flex items-center justify-between gap-3">
                <GlobalToggle />
                <ClearFiltersButton />
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {showListFilters && (
        <span className="shrink-0 font-medium text-sm text-zinc-600 dark:text-zinc-300">
          {t({ id: 'exploreChallenges.filterBar.title', defaultMessage: 'Challenge List Filters' })}
        </span>
      )}
      <LocationSearchFilter />
      <SortByFilter />
      {showListFilters && (
        <>
          <WorkOnFilter />
          <DifficultyFilter />
          <CategorizeFilter />
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
