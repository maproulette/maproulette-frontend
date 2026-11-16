import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  onTransitionEnd?: () => void
  children: React.ReactNode
  className?: string
  /** Use fixed positioning to overlay the entire viewport (default: absolute within parent) */
  fixed?: boolean
}

export const Drawer = ({
  open,
  onClose,
  onTransitionEnd,
  children,
  className,
  fixed = false,
}: DrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null)

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
        className={cn(
          `${pos} inset-x-0 bottom-0 ${zDrawer} flex h-[85%] flex-col overflow-hidden rounded-t-lg border-zinc-200 border-t bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-950`,
          open ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform') onTransitionEnd?.()
        }}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-slate-600" />
        </div>
        {/* Drawer content */}
        <div ref={drawerRef} className="flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </>
  )
}
