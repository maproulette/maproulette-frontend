import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useExploreChallengesSearchContext } from '@/components/Pages/ExploreChallengesPage/contexts/ExploreChallengesSearchContext'
import { ClearFiltersButton } from './ClearFiltersButton'
import { DifficultyFilter } from './DifficultyFilter'
import { GlobalToggle } from './GlobalMapToggles'
import { LocationSearchFilter } from './LocationSearchFilter'
import { SortByFilter } from './SortByFilter'
import { ViewModeToggle } from './ViewModeToggle'
import { WorkOnFilter } from './WorkOnFilter'

const DEBOUNCE_MS = 150

export const FilterBar = () => {
  const navigate = useNavigate()
  const {
    difficulty,
    workOn,
    selectedCategories,
    sortBy,
    viewMode,
    locationOsmType,
    locationOsmId,
    global,
    keywords,
  } = useExploreChallengesSearchContext()

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      navigate({
        to: '/',
        search: (prev) => ({
          ...prev,
          workOn: workOn !== 'Anything' ? workOn : undefined,
          categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
          sortBy: sortBy !== 'name' ? sortBy : undefined,
          global: global ? true : undefined,
          osm_type: (locationOsmType as 'N' | 'W' | 'R' | undefined) ?? undefined,
          osm_id: locationOsmId ?? undefined,
          keywords: keywords && keywords !== '' ? keywords : undefined,
          difficulty: difficulty !== 'Any' ? difficulty : undefined,
          viewMode: viewMode !== 'grid-map' ? viewMode : undefined,
        }),
        hash: true,
        replace: true,
      })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timeoutRef.current ?? undefined)
    }
  }, [
    workOn,
    selectedCategories,
    sortBy,
    global,
    locationOsmType,
    locationOsmId,
    keywords,
    difficulty,
    viewMode,
    navigate,
  ])

  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      <LocationSearchFilter />
      <SortByFilter />
      <WorkOnFilter />
      <DifficultyFilter />
      <GlobalToggle />
      <ClearFiltersButton />
      <div className="ml-auto">
        <ViewModeToggle />
      </div>
    </div>
  )
}
