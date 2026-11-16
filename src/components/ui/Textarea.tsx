import type * as React from 'react'

import { cn } from '@/lib/utils'

export const Textarea = ({ className, ref, ...props }: React.ComponentProps<'textarea'>) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    className={cn(
      'field-sizing-content flex min-h-16 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-zinc-500 focus-visible:border-zinc-950 focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-red-500/20 md:text-sm dark:border-slate-700 dark:bg-slate-800 dark:aria-invalid:border-red-900 dark:aria-invalid:ring-red-500/40 dark:dark:aria-invalid:ring-red-900/40 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50 dark:placeholder:text-zinc-400',
      className
    )}
    {...props}
  />
)
