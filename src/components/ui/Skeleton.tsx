import { cn } from '@/lib/utils'

export const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    className={cn('rounded-lg bg-muted motion-safe:animate-pulse', className)}
    {...props}
  />
)
