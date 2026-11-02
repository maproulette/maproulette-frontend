import { api } from '@/api'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/Empty'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { TopChallengeRow } from './TopChallengeRow'

interface Props {
  userId: number | undefined
  monthDuration?: number
  limit?: number
}

export const TopChallengesList = ({ userId, monthDuration = -1, limit = 5 }: Props) => {
  const { t } = useIntl()
  const { data, isLoading, isError } = api.user.topChallenges(userId, { monthDuration, limit })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }, (_, i) => `skeleton-${i}`).map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-zinc-500 dark:text-slate-400">
        {t({ id: 'topChallenges.list.loadError', defaultMessage: "Couldn't load top challenges right now." })}
      </p>
    )
  }

  const challenges = data ?? []

  if (challenges.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            {t({ id: 'topChallenges.list.emptyTitle', defaultMessage: 'No contributions yet' })}
          </EmptyTitle>
          <EmptyDescription>
            {t({ id: 'topChallenges.list.emptyDescription', defaultMessage: 'Once you start working on challenges, your top ones will show up here.' }
            )}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const maxActivity = challenges.reduce((max, c) => (c.activity > max ? c.activity : max), 0)

  return (
    <ul className="flex flex-col">
      {challenges.map((challenge, i) => (
        <li key={challenge.id}>
          <TopChallengeRow rank={i + 1} challenge={challenge} maxActivity={maxActivity} />
        </li>
      ))}
    </ul>
  )
}
