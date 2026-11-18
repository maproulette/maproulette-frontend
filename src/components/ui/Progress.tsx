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
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted-strong', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className="bg-(image:--accent-gradient) h-full w-full flex-1 transition-all"
      style={{ clipPath: `inset(0 ${100 - (value || 0)}% 0 0)` }}
    />
  </ProgressPrimitive.Root>
)
