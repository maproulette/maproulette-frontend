import * as ProgressPrimitive from '@radix-ui/react-progress'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const Progress = ({
  className,
  value,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) => (
  <ProgressPrimitive.Root
    data-slot="progress"
    aria-label={ariaLabel ?? (ariaLabelledby ? undefined : `${value ?? 0}% complete`)}
    aria-labelledby={ariaLabelledby}
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-zinc-900/20 dark:bg-slate-50/20',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className="h-full w-full flex-1 bg-zinc-900 transition-all dark:bg-slate-50"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
)
