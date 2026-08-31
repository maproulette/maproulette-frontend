import { Badge } from '@/components/ui/Badge'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import {
  TEAM_IMAGE_STATUS_APPROVED,
  TEAM_IMAGE_STATUS_PENDING,
  TEAM_IMAGE_STATUS_REJECTED,
} from '@/types/TeamImage'

interface TeamImageStatusBadgeProps {
  status: number
  className?: string
}

/** Where a team image sits in the super admin review process. */
export const TeamImageStatusBadge = ({ status, className }: TeamImageStatusBadgeProps) => {
  const { t } = useIntl()

  const { label, tone } = {
    [TEAM_IMAGE_STATUS_PENDING]: {
      label: t('teamImages.status.pending', undefined, 'Awaiting review'),
      tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    },
    [TEAM_IMAGE_STATUS_APPROVED]: {
      label: t('teamImages.status.approved', undefined, 'Approved'),
      tone: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    [TEAM_IMAGE_STATUS_REJECTED]: {
      label: t('teamImages.status.rejected', undefined, 'Rejected'),
      tone: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
  }[status] ?? {
    label: t('teamImages.status.unknown', undefined, 'Unknown'),
    tone: 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-400',
  }

  return (
    <Badge variant="secondary" className={cn(tone, className)}>
      {label}
    </Badge>
  )
}
