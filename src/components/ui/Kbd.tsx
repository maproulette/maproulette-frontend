import type * as React from 'react'
import { formatBinding, type ShortcutBinding } from '@/lib/keyboardShortcuts'
import { cn } from '@/lib/utils'

/** A single key cap. */
export const Kbd = ({ className, ...props }: React.ComponentProps<'kbd'>) => (
  <kbd
    data-slot="kbd"
    className={cn(
      'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white px-1.5 font-mono text-[0.6875rem] text-zinc-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-zinc-400',
      className
    )}
    {...props}
  />
)

/**
 * A shortcut's key caps, rendered from its binding so the keys shown are
 * always the keys the handler matches.
 */
export const KbdBinding = ({
  binding,
  className,
}: {
  binding: ShortcutBinding
  className?: string
}) => {
  const keys = formatBinding(binding)

  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1', className)}>
      {keys.map((key, index) => (
        <span key={key} className="inline-flex items-center gap-1">
          {index > 0 && <span className="text-[0.625rem] text-zinc-400">+</span>}
          <Kbd>{key}</Kbd>
        </span>
      ))}
    </span>
  )
}
