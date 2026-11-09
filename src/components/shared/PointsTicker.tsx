import { Link } from '@tanstack/react-router'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { DigitDisplay, type DigitDisplaySize } from './DigitDisplay'

interface Props {
  size?: DigitDisplaySize
  minDigits?: number
  linkToProfile?: boolean
  className?: string
}

export const PointsTicker = ({
  size = 'md',
  minDigits = 4,
  linkToProfile = false,
  className,
}: Props) => {
  const { user } = useAuthContext()
  const { t } = useIntl()

  if (!user) return null

  const score = user.score ?? 0

  const ticker = (
    <span className={cn('inline-flex items-center', className)}>
      <DigitDisplay value={score} size={size} minDigits={minDigits} />
    </span>
  )

  if (linkToProfile) {
    return (
      <Link
        to="/profile"
        aria-label={t(
          {
            id: 'shared.pointsTicker.viewProfile',
            defaultMessage:
              '{score, plural, one {# point — view profile} other {# points — view profile}}',
          },
          { score }
        )}
        className="inline-flex items-center rounded-sm hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
      >
        {ticker}
      </Link>
    )
  }

  return ticker
}
