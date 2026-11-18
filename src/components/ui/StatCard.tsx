import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const statCardVariants = cva('flex flex-col gap-1 rounded-lg p-4 transition-colors', {
  variants: {
    tone: {
      neutral: 'border-gradient bg-card',
      muted: 'border border-line bg-inset',
      info: 'border border-ocean-500/40 bg-ocean-500/10',
      success: 'border border-success/40 bg-success/10',
      warning: 'border border-warning/40 bg-warning/10',
      danger: 'border border-danger/40 bg-danger/10',
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    size: 'md',
  },
})

export type StatCardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof statCardVariants> & {
    label: React.ReactNode
    value: React.ReactNode
    icon?: React.ReactNode
    description?: React.ReactNode
  }

export const StatCard = ({
  className,
  tone,
  size,
  label,
  value,
  icon,
  description,
  ...props
}: StatCardProps) => (
  <div className={cn(statCardVariants({ tone, size }), className)} {...props}>
    <div className="flex items-start justify-between gap-2">
      <span className="font-medium text-fg-muted text-xs uppercase tracking-wide">{label}</span>
      {icon && <span className="text-fg-subtle">{icon}</span>}
    </div>
    <span className="font-semibold text-2xl text-fg leading-none tracking-tight">{value}</span>
    {description && <span className="text-fg-muted text-xs">{description}</span>}
  </div>
)

export const StatCardGrid = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4', className)}
    {...props}
  />
)
