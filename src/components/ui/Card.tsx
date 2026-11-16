import type * as React from 'react'
import { cn } from '@/lib/utils'

export const Card = ({ className, ref, ...props }: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl bg-white text-zinc-900 shadow-sm dark:bg-slate-800 dark:text-zinc-50 dark:shadow-none',
      className
    )}
    {...props}
  />
)

export const CardHeader = ({ className, ref, ...props }: React.ComponentProps<'div'>) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
)

export const CardTitle = ({ className, ref, ...props }: React.ComponentProps<'h3'>) => (
  <h3
    ref={ref}
    className={cn('font-semibold text-2xl leading-none tracking-tight', className)}
    {...props}
  />
)

export const CardDescription = ({ className, ref, ...props }: React.ComponentProps<'p'>) => (
  <p ref={ref} className={cn('text-sm text-zinc-500 dark:text-slate-400', className)} {...props} />
)

export const CardContent = ({ className, ref, ...props }: React.ComponentProps<'div'>) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
)

export const CardFooter = ({ className, ref, ...props }: React.ComponentProps<'div'>) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
)
