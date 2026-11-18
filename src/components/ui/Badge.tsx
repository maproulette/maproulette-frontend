import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border border-line px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[3px] aria-invalid:ring-danger/20 aria-invalid:border-danger transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-accent-fg [a&]:hover:bg-accent/90',
        secondary: 'border-transparent bg-muted text-fg [a&]:hover:bg-muted/90',
        success: 'border-success/40 bg-success/10 text-success [a&]:hover:bg-success/20',
        warning: 'border-warning/40 bg-warning/10 text-warning [a&]:hover:bg-warning/20',
        destructive: 'border-danger/40 bg-danger/10 text-danger [a&]:hover:bg-danger/20',
        outline: 'text-fg [a&]:hover:bg-muted [a&]:hover:text-fg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export const Badge = ({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
