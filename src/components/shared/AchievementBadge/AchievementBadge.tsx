import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { type AchievementDefinition, getAchievement } from '@/types/Achievement'

// The overlay (e.g. a points threshold) is unreadable at xs, so that size omits it.
const sizeClasses = {
  xs: { box: 'h-7 w-7 border', icon: 'size-4', overlay: null },
  sm: { box: 'h-12 w-12', icon: 'size-6', overlay: 'text-[0.6rem]' },
  md: { box: 'h-20 w-20', icon: 'size-10', overlay: 'text-xs' },
  lg: { box: 'h-32 w-32', icon: 'size-16', overlay: 'text-base' },
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
            'relative inline-flex items-center justify-center rounded-full border-2 transition-all',
            sz.box,
            locked
              ? 'border-line bg-inset opacity-40 grayscale'
              : 'border-mango-300 bg-gradient-to-br from-mango-100 to-mango-300 text-mango-900 dark:border-mango-700 dark:from-mango-900 dark:to-mango-700 dark:text-mango-100',
            className
          )}
        >
          <Icon className={sz.icon} aria-hidden="true" />
          {overlay && sz.overlay && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute right-1 bottom-1 rounded px-1 font-bold font-mono tracking-tight',
                sz.overlay,
                locked
                  ? 'bg-muted-strong text-fg-muted'
                  : 'bg-panel/80 text-mango-900 dark:text-mango-100'
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
