import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-zinc-950 focus-visible:ring-zinc-950/50 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 transition-[color,box-shadow] overflow-hidden dark:border-slate-800 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-zinc-900 text-zinc-50 [a&]:hover:bg-zinc-900/90 dark:bg-slate-50 dark:text-zinc-900 dark:[a&]:hover:bg-slate-50/90',
        secondary:
          'border-transparent bg-zinc-100 text-zinc-900 [a&]:hover:bg-zinc-100/90 dark:bg-slate-800 dark:text-zinc-50 dark:[a&]:hover:bg-slate-800/90',
        success:
          'border-transparent bg-green-700 text-white [a&]:hover:bg-green-800 dark:bg-green-700 dark:[a&]:hover:bg-green-600',
        warning:
          'border-transparent bg-yellow-500 text-zinc-950 [a&]:hover:bg-yellow-600 dark:bg-yellow-500 dark:text-zinc-950 dark:[a&]:hover:bg-yellow-400',
        caution:
          'border-transparent bg-orange-600 text-zinc-950 [a&]:hover:bg-orange-700 dark:bg-orange-500 dark:text-zinc-950 dark:[a&]:hover:bg-orange-400',
        info: 'border-transparent bg-blue-600 text-white [a&]:hover:bg-blue-700 dark:bg-blue-600 dark:[a&]:hover:bg-blue-500',
        destructive:
          'border-transparent bg-red-700 text-white [a&]:hover:bg-red-800 focus-visible:ring-red-500/20 dark:bg-red-700 dark:[a&]:hover:bg-red-600 dark:focus-visible:ring-red-500/40',
        outline:
          'text-zinc-950 [a&]:hover:bg-zinc-100 [a&]:hover:text-zinc-900 dark:text-zinc-50 dark:[a&]:hover:bg-slate-800 dark:[a&]:hover:text-zinc-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export const Badge = ({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
