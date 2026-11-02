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
      className={cn(
        'gap-1',
        enabled
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
          : 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-400',
        className
      )}
      variant={enabled ? 'default' : 'secondary'}
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
