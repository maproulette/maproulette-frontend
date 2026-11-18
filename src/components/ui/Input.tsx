import type * as React from 'react'

import { cn } from '@/lib/utils'

export const Input = ({ className, type, ...props }: React.ComponentProps<'input'>) => (
  <input
    type={type}
    data-slot="input"
    className={cn(
      'h-9 w-full min-w-0 rounded-lg border border-line-strong bg-field px-3 py-1 text-base outline-none transition-[color,box-shadow] selection:bg-steel-900 selection:text-steel-50 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-fg file:text-sm placeholder:text-fg-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:selection:bg-steel-50 dark:selection:text-steel-900',
      'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
      'aria-invalid:border-danger aria-invalid:ring-danger/20',
      className
    )}
    {...props}
  />
)
