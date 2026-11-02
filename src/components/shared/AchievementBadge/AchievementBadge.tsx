import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { type AchievementDefinition, getAchievement } from '@/types/Achievement'

const sizeClasses = {
  sm: { box: 'h-12 w-12', icon: 'size-6', overlay: 'text-[0.6rem]' },
  md: { box: 'h-20 w-20', icon: 'size-10', overlay: 'text-xs' },
  lg: { box: 'h-32 w-32', icon: 'size-16', overlay: 'text-base' },
} as const

type AchievementBadgeSize = keyof typeof sizeClasses

interface Props {
  achievement: number | AchievementDefinition
  size?: AchievementBadgeSize
  locked?: boolean
  showTooltip?: boolean
  onClick?: () => void
  className?: string
}

export const AchievementBadge = ({
  achievement,
  size = 'md',
  locked = false,
  showTooltip = true,
  onClick,
  className,
}: Props) => {
  const { t } = useIntl()
  const def = typeof achievement === 'number' ? getAchievement(achievement) : achievement

  if (!def) return null

  const { icon: Icon, title, description, overlay } = def
  const sz = sizeClasses[size]

  const badge = (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={
        locked
          ? t(
              { id: 'shared.achievementBadge.lockedLabel', defaultMessage: '{title} (locked)' },
              { title }
            )
          : title
      }
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border-2 transition-all',
        sz.box,
        locked
          ? 'cursor-default border-zinc-200 bg-zinc-50 opacity-40 grayscale dark:border-slate-700 dark:bg-slate-900'
          : 'border-amber-300 bg-gradient-to-br from-amber-100 to-amber-300 text-amber-900 shadow-sm dark:border-amber-700 dark:from-amber-900 dark:to-amber-700 dark:text-amber-100',
        onClick && !locked && 'cursor-pointer hover:scale-105 hover:shadow-md',
        className
      )}
    >
      <Icon className={sz.icon} aria-hidden="true" />
      {overlay && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute right-1 bottom-1 rounded px-1 font-bold font-mono tracking-tight',
            sz.overlay,
            locked
              ? 'bg-zinc-200/80 text-zinc-500 dark:bg-slate-700 dark:text-slate-400'
              : 'bg-white/80 text-amber-900 dark:bg-slate-900/80 dark:text-amber-100'
          )}
        >
          {overlay}
        </span>
      )}
    </button>
  )

  if (!showTooltip) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>
        <div className="max-w-xs">
          <div className="font-semibold">{title}</div>
          <div className="text-xs opacity-80">
            {locked
              ? t({ id: 'shared.achievementBadge.notYetEarned', defaultMessage: 'Not yet earned' })
              : description}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
