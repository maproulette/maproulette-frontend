import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

interface FilterToggleProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon?: React.ComponentType<{ className?: string }>
}

export const FilterToggle = ({
  label,
  checked,
  onCheckedChange,
  icon: Icon,
}: FilterToggleProps) => (
  <Toggle
    variant="outline"
    size="sm"
    pressed={checked}
    onPressedChange={onCheckedChange}
    className="shrink-0 gap-2 rounded-full px-3 font-normal text-fg data-[state=on]:border-accent data-[state=on]:bg-accent/10 data-[state=on]:text-fg hover:data-[state=on]:bg-accent/15"
  >
    {Icon && <Icon className={cn('h-4 w-4', !checked && 'text-fg-subtle')} />}
    <span>{label}</span>
    <span
      aria-hidden="true"
      className={cn('h-2 w-2 rounded-full', checked ? 'bg-accent' : 'bg-line-strong')}
    />
  </Toggle>
)
