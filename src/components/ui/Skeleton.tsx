import { cn } from '@/lib/utils'

export const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    className={cn('rounded-lg bg-zinc-100 motion-safe:animate-pulse dark:bg-slate-800', className)}
    {...props}
  />
)
