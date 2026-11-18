import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

const panelVariants = cva('rounded-lg border', {
  variants: {
    tone: {
      neutral: 'border-line bg-card',
      muted: 'border-line bg-inset',
      info: 'border-ocean-500/40 bg-ocean-500/10',
      success: 'border-success/40 bg-success/10',
      warning: 'border-warning/40 bg-warning/10',
      danger: 'border-danger/40 bg-danger/10',
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
