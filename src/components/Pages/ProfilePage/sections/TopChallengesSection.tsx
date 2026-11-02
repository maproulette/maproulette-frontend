import { useId } from 'react'
import { TopChallengesList } from '@/components/shared/TopChallengesList'
import { useIntl } from '@/i18n'
import { useProfilePageContext } from '../contexts/ProfilePageContext'

export const TopChallengesSection = () => {
  const { t } = useIntl()
  const { userId, timeRange } = useProfilePageContext()
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="font-semibold text-lg text-zinc-900 dark:text-slate-100">
        {t({ id: 'profilePage.topChallenges.title', defaultMessage: 'Top Challenges' })}
      </h2>
      <TopChallengesList userId={userId} monthDuration={timeRange.monthDuration} limit={5} />
    </section>
  )
}
