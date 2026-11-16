import { ChevronDown } from 'lucide-react'
import { useIntl } from '@/i18n'

interface ScrollIndicatorProps {
  hasMoreToScroll?: boolean
}

export const ScrollIndicator = ({ hasMoreToScroll }: ScrollIndicatorProps) => {
  const { t } = useIntl()

  if (!hasMoreToScroll) return null

  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex items-end justify-center pt-6 pb-2">
      <div className="flex flex-col items-center gap-1">
        <ChevronDown className="size-3.5 animate-bounce text-zinc-400 dark:text-slate-500" />
        <span className="text-xs text-zinc-500 dark:text-slate-400">
          {t({
            id: 'browsedChallengePage.scrollIndicator.scrollForMore',
            defaultMessage: 'Scroll for more',
          })}
        </span>
      </div>
    </div>
  )
}
