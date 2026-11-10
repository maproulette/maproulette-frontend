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
    className="shrink-0 gap-2 rounded-full px-3 font-normal text-zinc-700 data-[state=on]:border-zinc-900 data-[state=on]:bg-zinc-900 data-[state=on]:text-zinc-50 hover:data-[state=on]:bg-zinc-900/90 hover:data-[state=on]:text-zinc-50 dark:text-slate-300 dark:data-[state=on]:border-slate-50 dark:data-[state=on]:bg-slate-50 dark:data-[state=on]:text-zinc-900 dark:hover:data-[state=on]:bg-slate-50/90 dark:hover:data-[state=on]:text-zinc-900"
  >
    {Icon && <Icon className={cn('h-4 w-4', !checked && 'text-zinc-500 dark:text-slate-500')} />}
    <span>{label}</span>
    <span
      aria-hidden="true"
      className={cn(
        'h-2 w-2 rounded-full',
        checked
          ? 'bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.7)]'
          : 'bg-zinc-300 dark:bg-slate-600'
      )}
    />
  </Toggle>
)
