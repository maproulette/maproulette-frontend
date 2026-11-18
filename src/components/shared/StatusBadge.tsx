import { Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  enabled: boolean
  className?: string
}

export const StatusBadge = ({ enabled, className }: StatusBadgeProps) => {
  const { t } = useIntl()
  return (
    <Badge
      className={cn('gap-1', !enabled && 'text-fg-muted', className)}
      variant={enabled ? 'success' : 'secondary'}
      title={
        enabled
          ? t({ id: 'common.discoverable', defaultMessage: 'Discoverable' })
          : t({ id: 'shared.statusBadge.notDiscoverable', defaultMessage: 'Not discoverable' })
      }
    >
      {enabled ? (
        <Eye className="h-5 w-5" aria-hidden />
      ) : (
        <EyeOff className="h-5 w-5" aria-hidden />
      )}
    </Badge>
  )
}
