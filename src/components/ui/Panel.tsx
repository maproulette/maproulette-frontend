import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const panelVariants = cva('rounded-lg border', {
  variants: {
    tone: {
      neutral: 'border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-800',
      muted: 'border-zinc-200 bg-zinc-50 dark:border-slate-700 dark:bg-slate-900/50',
      info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
      success:
        'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100',
      warning:
        'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
      danger:
        'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
    elevation: {
      none: '',
      sm: 'shadow-xs',
      md: 'shadow-sm',
      lg: 'shadow-md',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    padding: 'md',
    elevation: 'none',
  },
})

export type PanelProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof panelVariants>

export const Panel = ({ className, tone, padding, elevation, ...props }: PanelProps) => (
  <div className={cn(panelVariants({ tone, padding, elevation }), className)} {...props} />
)
