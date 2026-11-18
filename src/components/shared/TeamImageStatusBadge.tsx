import { Badge } from '@/components/ui/Badge'
import { useIntl } from '@/i18n'
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

  const { label, variant } = {
    [TEAM_IMAGE_STATUS_PENDING]: {
      label: t({ id: 'teamImages.pendingHeading', defaultMessage: 'Awaiting review' }),
      variant: 'warning' as const,
    },
    [TEAM_IMAGE_STATUS_APPROVED]: {
      label: t({ id: 'teamImages.status.approved', defaultMessage: 'Approved' }),
      variant: 'success' as const,
    },
    [TEAM_IMAGE_STATUS_REJECTED]: {
      label: t({ id: 'teamImages.status.rejected', defaultMessage: 'Rejected' }),
      variant: 'destructive' as const,
    },
  }[status] ?? {
    label: t({ id: 'teamImages.status.unknown', defaultMessage: 'Unknown' }),
    variant: 'secondary' as const,
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
