import { Archive, Eye, EyeOff, type LucideIcon, Pause, Pin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface QuickActionButtonProps {
  active: boolean
  label: string
  icon: LucideIcon
  activeClassName: string
  onClick: () => void
  className?: string
}

const QuickActionButton = ({
  active,
  label,
  icon: Icon,
  activeClassName,
  onClick,
  className,
}: QuickActionButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    className={cn('h-8 w-8', className)}
    onClick={(e) => {
      e.preventDefault()
      onClick()
    }}
    title={label}
    aria-label={label}
  >
    <Icon
      className={cn(
        'h-4 w-4',
        active
          ? activeClassName
          : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
      )}
    />
  </Button>
)

const highlighted = 'text-amber-600 dark:text-amber-400'

export const PinButton = ({
  pinned,
  entity,
  onClick,
  className,
}: {
  pinned: boolean
  entity: 'challenge' | 'project'
  onClick: () => void
  className?: string
}) => {
  const { t } = useIntl()
  const label =
    entity === 'challenge'
      ? pinned
        ? t({ id: 'common.unpinChallenge', defaultMessage: 'Unpin challenge' })
        : t({ id: 'common.pinChallenge', defaultMessage: 'Pin challenge' })
      : pinned
        ? t({ id: 'common.unpinProject', defaultMessage: 'Unpin project' })
        : t({ id: 'common.pinProject', defaultMessage: 'Pin project' })
  return (
    <QuickActionButton
      active={pinned}
      label={label}
      icon={Pin}
      activeClassName={highlighted}
      onClick={onClick}
      className={className}
    />
  )
}

export const PauseButton = ({ paused, onClick }: { paused: boolean; onClick: () => void }) => {
  const { t } = useIntl()
  return (
    <QuickActionButton
      active={paused}
      label={
        paused
          ? t({ id: 'common.resumeChallenge', defaultMessage: 'Resume challenge' })
          : t({ id: 'common.pauseChallenge', defaultMessage: 'Pause challenge' })
      }
      icon={Pause}
      activeClassName={highlighted}
      onClick={onClick}
    />
  )
}

export const ArchiveButton = ({
  archived,
  onClick,
}: {
  archived: boolean
  onClick: () => void
}) => {
  const { t } = useIntl()
  return (
    <QuickActionButton
      active={archived}
      label={
        archived
          ? t({ id: 'common.unarchiveChallenge', defaultMessage: 'Unarchive challenge' })
          : t({ id: 'common.archiveChallenge', defaultMessage: 'Archive challenge' })
      }
      icon={Archive}
      activeClassName={highlighted}
      onClick={onClick}
    />
  )
}

export const DiscoverableButton = ({
  enabled,
  onClick,
}: {
  enabled: boolean
  onClick: () => void
}) => {
  const { t } = useIntl()
  return (
    <QuickActionButton
      active={enabled}
      label={
        enabled
          ? t({ id: 'common.makeNotDiscoverable', defaultMessage: 'Make not discoverable' })
          : t({ id: 'common.makeDiscoverable', defaultMessage: 'Make discoverable' })
      }
      icon={enabled ? Eye : EyeOff}
      activeClassName="text-emerald-600 dark:text-emerald-400"
      onClick={onClick}
    />
  )
}
