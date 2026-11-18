import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const Empty = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty"
    className={cn(
      'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12',
      className
    )}
    {...props}
  />
)

export const EmptyHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty-header"
    className={cn('flex max-w-sm flex-col items-center gap-1.5 text-center', className)}
    {...props}
  />
)

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "bg-inset text-current flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export const EmptyMedia = ({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) => (
  <div
    data-slot="empty-icon"
    data-variant={variant}
    className={cn(emptyMediaVariants({ variant, className }))}
    {...props}
  />
)

export const EmptyTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty-title"
    className={cn('font-semibold text-lg tracking-tight md:text-xl', className)}
    {...props}
  />
)

export const EmptyDescription = ({ className, ...props }: React.ComponentProps<'p'>) => (
  <div
    data-slot="empty-description"
    className={cn(
      'text-fg-muted text-sm/relaxed [&>a:hover]:text-fg [&>a]:underline [&>a]:underline-offset-4',
      className
    )}
    {...props}
  />
)

export const EmptyContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty-content"
    className={cn(
      'flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm',
      className
    )}
    {...props}
  />
)
