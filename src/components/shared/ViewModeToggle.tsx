import { LayoutGrid, List, Map as MapIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup'
import { useIntl } from '@/i18n'

const itemClass =
  'h-8 w-8 text-zinc-400 hover:bg-transparent hover:text-zinc-900 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-900 dark:text-slate-400 dark:hover:text-white dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-white'

type ViewMode = 'grid-map' | 'grid' | 'list'

interface ViewModeToggleProps<T extends ViewMode> {
  value: T
  onValueChange: (value: T) => void
  modes?: readonly T[]
}

export const ViewModeToggle = <T extends ViewMode>({
  value,
  onValueChange,
  modes = ['grid', 'list'] as T[],
}: ViewModeToggleProps<T>) => {
  const { t } = useIntl()
  const items = {
    'grid-map': {
      label: t({
        id: 'exploreChallenges.filterBar.viewMode.gridMap',
        defaultMessage: 'Grid with map view',
      }),
      Icon: MapIcon,
    },
    grid: { label: t({ id: 'common.gridView', defaultMessage: 'Grid view' }), Icon: LayoutGrid },
    list: { label: t({ id: 'common.listView', defaultMessage: 'List view' }), Icon: List },
  }
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onValueChange(v as T)
      }}
      className="overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-slate-800 dark:bg-slate-900"
    >
      {modes.map((mode) => {
        const { label, Icon } = items[mode]
        return (
          <ToggleGroupItem
            key={mode}
            value={mode}
            title={label}
            aria-label={label}
            size="sm"
            className={itemClass}
          >
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
