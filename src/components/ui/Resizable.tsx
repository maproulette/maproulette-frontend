import type * as React from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/lib/utils'

export const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    data-slot="resizable-panel-group"
    className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
    {...props}
  />
)

export const ResizablePanel = ({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) => (
  <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
)

export const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    data-slot="resizable-handle"
    className={cn(
      'group -ml-2 -mr-2 relative z-20 flex w-4 items-center justify-center transition-all duration-150 focus-visible:outline-hidden',
      'data-[panel-group-direction=vertical]:-mt-2 data-[panel-group-direction=vertical]:-mb-2 data-[panel-group-direction=vertical]:h-4 data-[panel-group-direction=vertical]:w-full',
      '[&[data-panel-group-direction=vertical]>div]:rotate-90',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="flex h-14 w-4 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-200">
        <div className="grid grid-cols-2 gap-[3px]">
          <div className="h-1 w-1 rounded-full bg-zinc-500" />
          <div className="h-1 w-1 rounded-full bg-zinc-500" />
          <div className="h-1 w-1 rounded-full bg-zinc-500" />
          <div className="h-1 w-1 rounded-full bg-zinc-500" />
          <div className="h-1 w-1 rounded-full bg-zinc-500" />
          <div className="h-1 w-1 rounded-full bg-zinc-500" />
        </div>
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)
