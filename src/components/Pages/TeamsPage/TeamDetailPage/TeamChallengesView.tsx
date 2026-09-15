import { Target } from 'lucide-react'
import { api } from '@/api'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { TeamChallengeActions } from './TeamChallengeActions'
import { useTeamDetailContext } from './TeamDetailContext'

/**
 * The Challenges tab: the challenges given to this team. The backend keeps out
 * any the viewer may not see, so an empty grid here means "nothing to show
 * you", not necessarily "nothing at all".
 */
export const TeamChallengesView = () => {
  const { t } = useIntl()
  const { teamId } = useTeamDetailContext()
  const { data: challenges = [], isLoading } = api.team.challenges(teamId)

  if (isLoading) return <Loader />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <EntityGrid
        items={challenges}
        getItemKey={(challenge) => challenge.id}
        renderItem={(challenge) => (
          <ChallengeCard
            challenge={challenge}
            actions={<TeamChallengeActions challenge={challenge} />}
          />
        )}
        emptyState={{
          icon: Target,
          title: t('teams.detail.noChallengesTitle', undefined, 'No challenges'),
          description: t(
            'teams.detail.noChallengesDescription',
            undefined,
            'No challenge has been given to this team yet.'
          ),
        }}
      />
    </div>
  )
}
