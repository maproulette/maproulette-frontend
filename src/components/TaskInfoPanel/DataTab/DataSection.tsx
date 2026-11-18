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
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-line">
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
        <Icon className="h-4 w-4 shrink-0 text-fg-muted" />
        <span className="font-medium text-fg text-sm">{title}</span>
        {meta && <span className="text-fg-muted text-xs">{meta}</span>}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 text-fg-subtle transition-transform',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="border-line border-t px-3 py-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
