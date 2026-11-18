import { useId } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  icon: React.ReactNode
  title: React.ReactNode
  count?: number
  /** Controls shown at the end of the header, e.g. a create button */
  actions?: React.ReactNode
  isLoading?: boolean
  error?: unknown
  className?: string
  children: React.ReactNode
}

/**
 * A titled dashboard panel whose body scrolls on its own. While loading or
 * after an error, the body shows that state instead of `children`.
 */
export const DashboardSection = ({
  icon,
  title,
  count,
  actions,
  isLoading,
  error,
  className,
  children,
}: DashboardSectionProps) => {
  const { t, formatNumber } = useIntl()
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-panel',
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        <span className="text-fg-muted [&_svg]:size-4">{icon}</span>
        <h2 id={headingId} className="font-medium text-fg text-sm">
          {title}
        </h2>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary">{formatNumber(count)}</Badge>
        )}
        {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader />
          </div>
        ) : error ? (
          <p className="py-2 text-center text-danger text-sm">
            {t({ id: 'dashboard.common.failedToLoad', defaultMessage: 'Failed to load' })}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

interface DashboardEmptyProps {
  icon: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
}

export const DashboardEmpty = ({ icon, title, description }: DashboardEmptyProps) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <div className="mb-2 rounded-lg bg-muted p-2 text-fg-muted [&_svg]:size-5">{icon}</div>
    <p className="font-medium text-fg text-sm">{title}</p>
    <p className="text-fg-muted text-sm">{description}</p>
  </div>
)
