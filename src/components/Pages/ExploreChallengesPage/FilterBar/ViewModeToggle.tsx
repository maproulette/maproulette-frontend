import { LayoutGrid, List, Map as MapIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup'
import { useIntl } from '@/i18n'
import { useExploreChallengesSearchContext } from '../contexts/ExploreChallengesSearchContext'

const itemClass =
  'h-8 w-8 text-zinc-400 hover:bg-transparent hover:text-zinc-900 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-900 dark:text-slate-400 dark:hover:text-white dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-white'

export const ViewModeToggle = () => {
  const { t } = useIntl()
  const { viewMode, setViewMode } = useExploreChallengesSearchContext()
  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(value) => {
        if (value) setViewMode(value as typeof viewMode)
      }}
      className="overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-slate-800 dark:bg-slate-900"
    >
      <ToggleGroupItem
        value="grid-map"
        title={t({
          id: 'exploreChallenges.filterBar.viewMode.gridMap',
          defaultMessage: 'Grid with map view',
        })}
        size="sm"
        className={itemClass}
      >
        <MapIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="grid"
        title={t({ id: 'common.gridView', defaultMessage: 'Grid view' })}
        size="sm"
        className={itemClass}
      >
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        title={t({ id: 'common.listView', defaultMessage: 'List view' })}
        size="sm"
        className={itemClass}
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
