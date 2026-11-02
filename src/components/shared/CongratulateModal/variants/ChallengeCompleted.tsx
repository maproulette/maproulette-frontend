import { Link } from '@tanstack/react-router'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'

interface Props {
  challengeName: string
  onDismiss: () => void
}

export const ChallengeCompletedContent = ({ challengeName, onDismiss }: Props) => {
  const { t } = useIntl()
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Flag className="size-14 text-emerald-500" aria-hidden="true" />
      <div>
        <h2 className="font-bold text-xl">
          {t({ id: 'congratulateModal.challengeCompleted.title', defaultMessage: 'You finished {challengeName}!' }, { challengeName }
          )}
        </h2>
        <p className="text-zinc-600 dark:text-slate-400">
          {t({ id: 'congratulateModal.challengeCompleted.description', defaultMessage: 'There are no more open tasks in this challenge.' }
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild onClick={onDismiss}>
          <Link to="/profile">
            {t({ id: 'congratulateModal.challengeCompleted.reviewStats', defaultMessage: 'Review your stats' })}
          </Link>
        </Button>
        <Button asChild onClick={onDismiss}>
          <Link to="/">
            {t({ id: 'congratulateModal.challengeCompleted.findAnother', defaultMessage: 'Find another challenge' }
            )}
          </Link>
        </Button>
      </div>
    </div>
  )
}
