import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  children?: React.ReactNode
  className?: string
  /** Panel width classes; default ~md */
  widthClassName?: string
  /** Accessible title for the panel */
  'aria-label'?: string
}

/**
 * Right-edge side panel with backdrop. Used by plugins (e.g. review dashboard)
 * and any host feature that needs keep-page-context detail views.
 */
export const SidePanel = ({
  open,
  onClose,
  children,
  className,
  widthClassName = 'w-full max-w-md',
  'aria-label': ariaLabel = 'Detail panel',
}: SidePanelProps) => {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex flex-col border-zinc-200 border-l bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950',
          widthClassName,
          open ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {children}
      </aside>
    </>
  )
}

export const SidePanelHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex shrink-0 items-start justify-between gap-3 border-zinc-200 border-b px-4 py-3 dark:border-slate-700',
      className
    )}
    {...props}
  />
)

export const SidePanelTitle = ({ className, ...props }: React.ComponentProps<'h2'>) => (
  <h2
    className={cn('m-0 font-semibold text-base text-zinc-900 dark:text-slate-100', className)}
    {...props}
  />
)

export const SidePanelBody = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-4', className)} {...props} />
)

export const SidePanelFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex shrink-0 flex-wrap items-center justify-end gap-2 border-zinc-200 border-t px-4 py-3 dark:border-slate-700',
      className
    )}
    {...props}
  />
)
