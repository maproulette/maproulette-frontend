import * as SeparatorPrimitive from '@radix-ui/react-separator'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const Separator = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) => (
  <SeparatorPrimitive.Root
    data-slot="separator"
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-zinc-200 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px dark:bg-slate-800',
      className
    )}
    {...props}
  />
)
