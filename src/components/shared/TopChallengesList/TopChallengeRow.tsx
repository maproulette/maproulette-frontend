import { Link } from '@tanstack/react-router'
import type { LeaderboardChallenge } from '@/api/user/profile'
import { Progress } from '@/components/ui/Progress'
import { useIntl } from '@/i18n'

interface Props {
  rank: number
  challenge: LeaderboardChallenge
  maxActivity: number
}

export const TopChallengeRow = ({ rank, challenge, maxActivity }: Props) => {
  const { t } = useIntl()
  const percent = maxActivity > 0 ? Math.round((challenge.activity / maxActivity) * 100) : 0

  return (
    <div className="group stretched-link-container grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-slate-800">
      <span className="font-mono text-sm text-zinc-500 dark:text-slate-400">{rank}.</span>
      <div className="min-w-0">
        <div className="truncate font-medium text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400">
          <Link
            to="/challenge/$challengeId"
            params={{ challengeId: String(challenge.id) }}
            className="stretched-link"
          >
            {challenge.name}
          </Link>
        </div>
        <Progress value={percent} className="mt-1 h-1" />
      </div>
      <span className="font-mono text-xs text-zinc-500 tabular-nums dark:text-slate-400">
        {t(
          'common.tasksWithCount',
          { count: challenge.activity },
          '{count, plural, one {# task} other {# tasks}}'
        )}
      </span>
    </div>
  )
}
