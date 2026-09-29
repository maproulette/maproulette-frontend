import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current dark:border-slate-800',
  {
    variants: {
      variant: {
        default: 'bg-white text-zinc-950 dark:bg-slate-950 dark:text-zinc-50',
        destructive:
          // red-500 fails WCAG AA contrast on white (~3.8:1); red-600 clears it. dark:text-red-900
          // was near-invisible dark-red-on-near-black — red-400 is the correct light-on-dark pairing.
          'text-red-600 bg-white [&>svg]:text-current *:data-[slot=alert-description]:text-red-600 dark:text-red-400 dark:bg-slate-950 dark:*:data-[slot=alert-description]:text-red-400/90',
        warning:
          // yellow-600 fails WCAG AA contrast on white (~2.9:1); yellow-700 clears it (~4.9:1).
          'text-yellow-700 bg-white [&>svg]:text-current *:data-[slot=alert-description]:text-yellow-700 dark:text-yellow-500 dark:bg-slate-950 dark:*:data-[slot=alert-description]:text-yellow-500/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export const Alert = ({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) => (
  <div
    data-slot="alert"
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
)

export const AlertTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-title"
    className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
    {...props}
  />
)

export const AlertDescription = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-description"
    className={cn(
      'col-start-2 grid justify-items-start gap-1 text-sm text-zinc-500 dark:text-zinc-400 [&_p]:leading-relaxed',
      className
    )}
    {...props}
  />
)
