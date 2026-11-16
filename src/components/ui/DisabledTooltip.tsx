import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface DisabledTooltipProps {
  show: boolean
  message: string
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
}

export const DisabledTooltip = ({
  show,
  message,
  className,
  side,
  children,
}: DisabledTooltipProps) => {
  if (!show) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent side={side}>{message}</TooltipContent>
    </Tooltip>
  )
}
