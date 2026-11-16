import type { LucideIcon } from 'lucide-react'

interface StatusRowProps {
  variant: 'status'
  color: string
  icon: LucideIcon
  label: string
}

interface PriorityRowProps {
  variant: 'priority'
  color: string
  label: string
}

type Props = StatusRowProps | PriorityRowProps

export const LegendRow = (props: Props) => {
  return (
    <li className="flex items-center gap-2 text-xs">
      {props.variant === 'status' ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block size-3.5 shrink-0 rounded-full border border-zinc-900/20 dark:border-white/20"
            style={{ backgroundColor: props.color }}
          />
          <props.icon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-zinc-700 dark:text-zinc-200"
            strokeWidth={2.5}
          />
        </>
      ) : (
        <span
          aria-hidden="true"
          className="relative inline-block size-4 shrink-0 overflow-hidden rounded-sm bg-zinc-200 dark:bg-slate-700"
        >
          <span
            className="absolute inset-0"
            style={{
              backgroundColor: props.color,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
            }}
          />
        </span>
      )}
      <span>{props.label}</span>
    </li>
  )
}
