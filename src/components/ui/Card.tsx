import type * as React from 'react'
import { cn } from '@/lib/utils'

export const Card = ({ className, ref, ...props }: React.ComponentProps<'div'>) => (
  <div
    ref={ref}
    className={cn('rounded-xl border border-line bg-card text-fg', className)}
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
  <p ref={ref} className={cn('text-fg-muted text-sm', className)} {...props} />
)

export const CardContent = ({ className, ref, ...props }: React.ComponentProps<'div'>) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
)

export const CardFooter = ({ className, ref, ...props }: React.ComponentProps<'div'>) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
)
