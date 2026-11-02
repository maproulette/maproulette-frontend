import { Crown } from 'lucide-react'
import { useIntl } from '@/i18n'

interface Props {
  level: number
  score: number
}

export const LevelUpContent = ({ level, score }: Props) => {
  const { t } = useIntl()
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Crown className="size-14 text-amber-500" aria-hidden="true" />
      <div>
        <h2 className="font-bold text-xl">
          {t({ id: 'congratulateModal.levelUp.title', defaultMessage: 'You leveled up!' })}
        </h2>
        <p className="text-zinc-600 dark:text-slate-400">
          {t({ id: 'congratulateModal.levelUp.description', defaultMessage: "Welcome to level {level}. You've reached {score} points." }, { level, score: score.toLocaleString() }
          )}
        </p>
      </div>
    </div>
  )
}
