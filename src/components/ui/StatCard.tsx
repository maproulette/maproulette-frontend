import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const statCardVariants = cva('flex flex-col gap-1 rounded-lg border p-4 transition-colors', {
  variants: {
    tone: {
      neutral: 'border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-800',
      muted: 'border-zinc-200 bg-zinc-50 dark:border-slate-700 dark:bg-slate-900/50',
      info: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40',
      success: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40',
      warning: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
      danger: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
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
      {/* zinc-500 fails WCAG AA contrast on the tinted (blue-50/red-50/etc.) tone backgrounds (~4.4:1); zinc-600 clears it. */}
      <span className="font-medium text-xs text-zinc-600 uppercase tracking-wide dark:text-zinc-400">
        {label}
      </span>
      {icon && <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>}
    </div>
    <span className="font-semibold text-2xl text-zinc-900 leading-none tracking-tight dark:text-zinc-50">
      {value}
    </span>
    {description && <span className="text-xs text-zinc-600 dark:text-zinc-400">{description}</span>}
  </div>
)

export const StatCardGrid = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4', className)}
    {...props}
  />
)
