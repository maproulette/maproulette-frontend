import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const ScrollArea = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) => {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        // Keyboard-scrollable even when the content has no focusable
        // descendant of its own (Radix's own recommendation).
        tabIndex={0}
        className="[&>div]:!block [&>div]:!w-full size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 dark:focus-visible:ring-zinc-300/50"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

export const ScrollBar = ({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    data-slot="scroll-area-scrollbar"
    orientation={orientation}
    className={cn(
      'flex touch-none select-none p-px transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      data-slot="scroll-area-thumb"
      className="relative flex-1 rounded-full bg-zinc-200 dark:bg-slate-800"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
)
