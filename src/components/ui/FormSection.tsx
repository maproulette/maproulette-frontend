import type * as React from 'react'
import { cn } from '@/lib/utils'

export const FormSection = ({
  className,
  title,
  description,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode
  description?: React.ReactNode
}) => (
  <section className={cn('space-y-4', className)} {...props}>
    {(title || description) && (
      <header className="space-y-1">
        {title && <h3 className="font-semibold text-base text-fg leading-none">{title}</h3>}
        {description && <p className="text-fg-muted text-sm">{description}</p>}
      </header>
    )}
    <div className="space-y-4">{children}</div>
  </section>
)

export const FormSectionGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('space-y-6', className)} {...props} />
)
