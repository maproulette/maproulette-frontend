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
        {title && (
          <h3 className="font-semibold text-base text-zinc-900 leading-none dark:text-zinc-50">
            {title}
          </h3>
        )}
        {description && <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>}
      </header>
    )}
    <div className="space-y-4">{children}</div>
  </section>
)

export const FormSectionGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('space-y-6', className)} {...props} />
)
