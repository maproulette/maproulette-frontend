import { cn } from '@/lib/utils'

export const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    className={cn('animate-pulse rounded-lg bg-zinc-100 dark:bg-slate-800', className)}
    {...props}
  />
)
