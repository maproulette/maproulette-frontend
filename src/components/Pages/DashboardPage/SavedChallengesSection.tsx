import { Bookmark } from 'lucide-react'
import { api } from '@/api'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { useIntl } from '@/i18n'
import { DashboardEmpty, DashboardSection } from './DashboardSection'
import { SavedChallengeActions } from './SavedChallengeActions'

interface SavedChallengesSectionProps {
  userId: number
}

export const SavedChallengesSection = ({ userId }: SavedChallengesSectionProps) => {
  const { t } = useIntl()
  // FIXME: the backend ignores the paging params here and always returns every saved challenge.
  const { data: challenges, isLoading, error } = api.user.savedChallenges(userId)

  return (
    <DashboardSection
      icon={<Bookmark />}
      title={t({ id: 'dashboard.savedChallenges.title', defaultMessage: 'Saved Challenges' })}
      count={challenges?.length}
      isLoading={isLoading}
      error={error}
    >
      {challenges?.length === 0 ? (
        <DashboardEmpty
          icon={<Bookmark />}
          title={t({
            id: 'dashboard.savedChallenges.empty.title',
            defaultMessage: 'No saved challenges',
          })}
          description={t({
            id: 'dashboard.savedChallenges.empty.description',
            defaultMessage: 'Save challenges to work on later',
          })}
        />
      ) : (
        <div className="space-y-3">
          {challenges?.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              actions={<SavedChallengeActions challenge={challenge} userId={userId} />}
            />
          ))}
        </div>
      )}
    </DashboardSection>
  )
}
