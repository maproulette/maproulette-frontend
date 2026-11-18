import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { type AchievementDefinition, getAchievement } from '@/types/Achievement'

// The overlay (e.g. a points threshold) is unreadable at xs, so that size omits it.
const sizeClasses = {
  xs: { box: 'size-7', ring: 'p-px', icon: 'size-3.5', overlay: null },
  sm: { box: 'size-12', ring: 'p-[1.5px]', icon: 'size-5', overlay: 'text-[0.6rem]' },
  md: { box: 'size-20', ring: 'p-0.5', icon: 'size-9', overlay: 'text-xs' },
  lg: { box: 'size-32', ring: 'p-[3px]', icon: 'size-14', overlay: 'text-sm' },
} as const

type AchievementBadgeSize = keyof typeof sizeClasses

interface Props {
  achievement: number | AchievementDefinition
  size?: AchievementBadgeSize
  locked?: boolean
  className?: string
}

export const AchievementBadge = ({
  achievement,
  size = 'md',
  locked = false,
  className,
}: Props) => {
  const { t } = useIntl()
  const def = typeof achievement === 'number' ? getAchievement(achievement) : achievement

  if (!def) return null

  const { icon: Icon, title, description, overlay } = def
  const sz = sizeClasses[size]
  const label = t(title)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={
            locked
              ? t(
                  { id: 'shared.achievementBadge.lockedLabel', defaultMessage: '{title} (locked)' },
                  { title: label }
                )
              : label
          }
          className={cn(
            'relative inline-flex shrink-0 rounded-full',
            sz.box,
            locked
              ? 'border border-line-strong border-dashed text-fg-subtle [&_svg]:opacity-60'
              : cn(
                  'bg-linear-to-br from-(--accent-from) to-(--accent-to) text-teal-700 dark:bg-accent dark:bg-none dark:text-mint-200',
                  sz.ring
                ),
            className
          )}
        >
          <span
            className={cn(
              'flex size-full items-center justify-center rounded-full',
              !locked && 'bg-linear-to-br from-mint-50 to-ocean-50 dark:bg-none dark:bg-teal-950'
            )}
          >
            <Icon className={sz.icon} aria-hidden="true" />
          </span>
          {overlay && sz.overlay && (
            <span
              aria-hidden="true"
              className={cn(
                '-bottom-1.5 -translate-x-1/2 absolute left-1/2 rounded-full px-1.5 font-semibold tabular-nums leading-snug',
                sz.overlay,
                locked
                  ? 'bg-muted-strong text-fg-muted'
                  : 'bg-linear-to-r from-(--accent-from) to-(--accent-to) text-accent-fg dark:bg-accent dark:bg-none'
              )}
            >
              {overlay}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-xs">
          <div className="font-semibold">{label}</div>
          <div className="text-xs opacity-80">
            {locked
              ? t({ id: 'shared.achievementBadge.notYetEarned', defaultMessage: 'Not yet earned' })
              : t(description)}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
