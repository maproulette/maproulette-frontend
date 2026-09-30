import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'h-6 w-4 text-sm',
  md: 'h-8 w-5 text-base',
  lg: 'h-11 w-7 text-xl',
} as const

export type DigitDisplaySize = keyof typeof sizeClasses

interface Props {
  value: number
  minDigits?: number
  size?: DigitDisplaySize
  className?: string
  ariaLabel?: string
}

const splitDigits = (value: number, minDigits: number): { char: string; place: number }[] => {
  const safe = Math.max(0, Math.floor(value))
  const raw = safe.toString()
  const padding = Math.max(0, minDigits - raw.length)
  const chars = Array.from({ length: padding }, () => ' ').concat(raw.split(''))
  return chars.map((char, index) => ({ char, place: chars.length - 1 - index }))
}

export const DigitDisplay = ({
  value,
  minDigits = 4,
  size = 'md',
  className,
  ariaLabel,
}: Props) => {
  const { t } = useIntl()
  const digits = splitDigits(value, minDigits)
  const sizeClass = sizeClasses[size]

  return (
    <span className={cn('inline-flex gap-0.5 font-bold font-mono', className)}>
      <span className="sr-only">
        {ariaLabel ?? t('shared.digitDisplay.pointsLabel', { value }, '{value} points')}
      </span>
      {digits.map(({ char, place }) => {
        const isBlank = char === ' '
        return (
          <span
            key={place}
            aria-hidden="true"
            className={cn(
              'inline-flex items-center justify-center rounded border',
              sizeClass,
              isBlank
                ? 'border-zinc-100 bg-zinc-50 text-zinc-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700'
                : 'border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
            )}
          >
            {isBlank ? '0' : char}
          </span>
        )
      })}
    </span>
  )
}
