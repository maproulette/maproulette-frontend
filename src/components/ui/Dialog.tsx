import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'
import { useSuspendShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * Radix's dialog root, plus one thing it cannot know about: while a dialog
 * holds the screen, keyboard shortcuts must not act on whatever is behind it.
 * Radix traps focus, but a bare letter still reaches the window listener.
 */
export const Dialog = ({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(Boolean(defaultOpen))
  const isControlled = open !== undefined

  useSuspendShortcuts(isControlled ? Boolean(open) : uncontrolledOpen)

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <DialogPrimitive.Root
      {...(isControlled ? { open } : { defaultOpen })}
      onOpenChange={handleOpenChange}
      {...props}
    />
  )
}

export const DialogTrigger = DialogPrimitive.Trigger

export const DialogPortal = DialogPrimitive.Portal

export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
)

const dialogContentSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
} as const

export type DialogContentSize = keyof typeof dialogContentSizes

export const DialogContent = ({
  className,
  children,
  ref,
  size = 'lg',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { size?: DialogContentSize }) => {
  const { t } = useIntl()

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-full translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto border border-zinc-200 bg-white p-6 shadow-xl duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg dark:border-slate-700 dark:bg-slate-900',
          dialogContentSizes[size],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-500 dark:ring-offset-slate-900 dark:data-[state=open]:bg-slate-700 dark:data-[state=open]:text-slate-400 dark:focus:ring-zinc-300">
          <X className="h-4 w-4" />
          <span className="sr-only">{t({ id: 'common.close', defaultMessage: 'Close' })}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)

export const DialogTitle = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-semibold text-lg leading-none tracking-tight', className)}
    {...props}
  />
)

export const DialogDescription = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}
    {...props}
  />
)
