import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { buttonVariants } from '@/components/ui/Button'

import { useSuspendShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { cn } from '@/lib/utils'

/** Suspends keyboard shortcuts while open, for the same reason as `Dialog`. */
export const AlertDialog = ({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(Boolean(defaultOpen))
  const isControlled = open !== undefined

  useSuspendShortcuts(isControlled ? Boolean(open) : uncontrolledOpen)

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <AlertDialogPrimitive.Root
      {...(isControlled ? { open } : { defaultOpen })}
      onOpenChange={handleOpenChange}
      {...props}
    />
  )
}

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export const AlertDialogPortal = AlertDialogPrimitive.Portal

export const AlertDialogOverlay = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
    ref={ref}
  />
)

export const AlertDialogContent = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-200 bg-white p-6 shadow-xl duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg dark:border-slate-800 dark:bg-slate-950',
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
)

export const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)

export const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)

export const AlertDialogTitle = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('font-semibold text-lg', className)}
    {...props}
  />
)

export const AlertDialogDescription = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}
    {...props}
  />
)

export const AlertDialogAction = ({
  className,
  variant,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<VariantProps<typeof buttonVariants>, 'variant'>) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants({ variant, size: 'lg' }), className)}
    {...props}
  />
)

export const AlertDialogCancel = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'mt-2 sm:mt-0', className)}
    {...props}
  />
)
