import type * as React from 'react'

import { cn } from '@/lib/utils'

export const Textarea = ({ className, ref, ...props }: React.ComponentProps<'textarea'>) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    className={cn(
      'field-sizing-content flex min-h-16 w-full rounded-lg border border-line-strong bg-field px-3 py-2 text-base outline-none transition-[color,box-shadow] placeholder:text-fg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger/20 md:text-sm',
      className
    )}
    {...props}
  />
)
