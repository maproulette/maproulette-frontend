import { ChevronDown, type LucideIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { cn } from '@/lib/utils'

interface DataSectionProps {
  icon: LucideIcon
  title: string
  /** Short summary shown next to the title, e.g. a count */
  meta?: string
  defaultOpen?: boolean
  children: ReactNode
}

/** One collapsible block of the Data tab. */
export const DataSection = ({
  icon: Icon,
  title,
  meta,
  defaultOpen = false,
  children,
}: DataSectionProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-zinc-200 dark:border-slate-700"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-slate-800/50">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-slate-400" />
        <span className="font-medium text-sm text-zinc-900 dark:text-white">{title}</span>
        {meta && <span className="text-xs text-zinc-500 dark:text-slate-400">{meta}</span>}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 text-zinc-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="border-zinc-200 border-t px-3 py-3 dark:border-slate-700">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
