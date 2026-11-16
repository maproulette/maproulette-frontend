import type * as React from 'react'

import { cn } from '@/lib/utils'

export const Input = ({ className, type, ...props }: React.ComponentProps<'input'>) => (
  <input
    type={type}
    data-slot="input"
    className={cn(
      'h-9 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-zinc-900 selection:text-zinc-50 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-sm file:text-zinc-950 placeholder:text-zinc-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-zinc-400 dark:file:text-zinc-50 dark:selection:bg-zinc-50 dark:selection:text-zinc-900',
      'focus-visible:border-zinc-950 focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50',
      'aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:border-red-900 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40',
      className
    )}
    {...props}
  />
)
