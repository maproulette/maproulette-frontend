import * as TabsPrimitive from '@radix-ui/react-tabs'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const Tabs = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root
    data-slot="tabs"
    className={cn('flex flex-col gap-2', className)}
    {...props}
  />
)

export const TabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    className={cn(
      'inline-flex w-fit items-center justify-center rounded-full bg-black/5 text-sm dark:bg-white/5',
      className
    )}
    {...props}
  />
)

export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    data-slot="tabs-trigger"
    className={cn(
      "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-color transition-colors focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-accent data-[state=active]:text-accent-fg [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
)

export const TabsContent = ({
  className,
  fill = false,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content> & { fill?: boolean }) => (
  <TabsPrimitive.Content
    data-slot="tabs-content"
    className={cn(
      'flex-1 outline-none',
      fill && 'min-h-0 flex-auto data-[state=active]:flex data-[state=active]:flex-col',
      className
    )}
    {...props}
  />
)
