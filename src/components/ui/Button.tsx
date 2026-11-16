import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-zinc-950 focus-visible:ring-zinc-950/50 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-slate-50 dark:text-zinc-900 dark:hover:bg-slate-50/90',
        destructive:
          // red-500 fails WCAG AA contrast with white text (~3.8:1); red-600 clears it.
          'bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-600/20 dark:focus-visible:ring-red-600/40 dark:bg-red-900 dark:hover:bg-red-900/90 dark:focus-visible:ring-red-900/20',
        outline:
          'border border-zinc-300 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700',
        secondary:
          'bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-slate-800 dark:text-zinc-50 dark:hover:bg-slate-800/80',
        ghost:
          'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-slate-100/50 dark:hover:bg-slate-800 dark:hover:text-zinc-50 dark:dark:hover:bg-slate-800/50',
        link: 'link',
        success:
          // green-600 fails WCAG AA contrast with white text (~3.2:1); green-700 clears it.
          'bg-green-700 text-white shadow-xs hover:bg-green-800 focus-visible:ring-green-700/20 dark:bg-green-700 dark:hover:bg-green-600 dark:focus-visible:ring-green-600/40',
        info: 'bg-blue-600 text-white shadow-xs hover:bg-blue-700 focus-visible:ring-blue-600/20 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus-visible:ring-blue-500/40',
        warning:
          // yellow-600 fails WCAG AA contrast with white text (~2.9:1); yellow-800 clears it.
          'bg-yellow-800 text-white shadow-xs hover:bg-yellow-900 focus-visible:ring-yellow-800/20 dark:bg-yellow-800 dark:hover:bg-yellow-700 dark:focus-visible:ring-yellow-700/40',
        caution:
          // orange-600 fails WCAG AA contrast with white text (~3.6:1); orange-700 clears it.
          'bg-orange-700 text-white shadow-xs hover:bg-orange-800 focus-visible:ring-orange-700/20 dark:bg-orange-700 dark:hover:bg-orange-600 dark:focus-visible:ring-orange-600/40',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
