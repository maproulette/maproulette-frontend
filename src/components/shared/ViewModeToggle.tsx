import { LayoutGrid, List, Map as MapIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup'
import { useIntl } from '@/i18n'

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
      variant="outline"
    >
      {modes.map((mode) => {
        const { label, Icon } = items[mode]
        return (
          <ToggleGroupItem key={mode} value={mode} title={label} aria-label={label}>
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
