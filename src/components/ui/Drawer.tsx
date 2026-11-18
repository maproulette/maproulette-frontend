import { useEffect, useRef } from 'react'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  onTransitionEnd?: () => void
  children: React.ReactNode
  className?: string
  /** Use fixed positioning to overlay the entire viewport (default: absolute within parent) */
  fixed?: boolean
  'aria-label': string
}

export const Drawer = ({
  open,
  onClose,
  onTransitionEnd,
  children,
  className,
  fixed = false,
  'aria-label': ariaLabel,
}: DrawerProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocus(panelRef, open)

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const pos = fixed ? 'fixed' : 'absolute'
  const z = fixed ? 'z-50' : 'z-10'
  const zDrawer = fixed ? 'z-50' : 'z-20'

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          `${pos} inset-0 ${z} bg-black/40 transition-opacity duration-300`,
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer sliding up from bottom */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        inert={!open}
        className={cn(
          `${pos} inset-x-0 bottom-0 ${zDrawer} flex h-[85%] flex-col overflow-hidden rounded-t-lg border-line border-t bg-popover shadow-2xl outline-none transition-transform duration-300 ease-in-out`,
          open ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform') onTransitionEnd?.()
        }}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-line-strong" />
        </div>
        {/* Drawer content */}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </>
  )
}
