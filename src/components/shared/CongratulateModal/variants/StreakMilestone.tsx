import { Flame } from 'lucide-react'
import { useIntl } from '@/i18n'

interface Props {
  count: number
}

export const StreakMilestoneContent = ({ count }: Props) => {
  const { t } = useIntl()
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Flame className="size-14 text-orange-500" aria-hidden="true" />
      <div>
        <h2 className="font-bold text-xl">
          {t({ id: 'congratulateModal.streak.title', defaultMessage: 'Hot streak!' })}
        </h2>
        <p className="text-zinc-600 dark:text-slate-400">
          {t(
            {
              id: 'congratulateModal.streak.description',
              defaultMessage:
                '{count, plural, one {# task in a row — keep it going.} other {# tasks in a row — keep it going.}}',
            },
            { count }
          )}
        </p>
      </div>
    </div>
  )
}
