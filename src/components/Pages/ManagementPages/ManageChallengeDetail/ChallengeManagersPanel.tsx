import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  challengeManagersOptions,
  challengeTeamManagersOptions,
  useRemoveChallengeUser,
  useRemoveTeamFromChallenge,
  useSetChallengeUserRole,
  useSetTeamChallengeRole,
} from '@/api/challenge'
import { ManagersPanel } from '@/components/Pages/ManagementPages/shared/ManagersPanel'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { TEAM_ATTACHMENT_ROLE } from '@/lib/projectRoles'

/**
 * Who can manage this challenge in particular. A role granted here reaches only
 * this challenge -- it is for letting someone at one piece of work without
 * handing them the whole project. Anyone who already manages the parent project,
 * or manages the team that owns this challenge, gets in regardless and is not
 * listed here.
 */
export const ChallengeManagersPanel = ({ challengeId }: { challengeId: number }) => {
  const { t } = useIntl()
  const { data: managers, isLoading } = useQuery(challengeManagersOptions(challengeId))
  const { data: teamManagers } = useQuery(challengeTeamManagersOptions(challengeId))
  const setUserRole = useSetChallengeUserRole()
  const removeUser = useRemoveChallengeUser()
  const setTeamRole = useSetTeamChallengeRole()
  const removeTeam = useRemoveTeamFromChallenge()

  const handleRemove = async (userId: number, displayName: string) => {
    try {
      await removeUser.mutateAsync({ challengeId, userId })
      toast.success(
        t(
          {
            id: 'manageChallengeDetail.managers.removed',
            defaultMessage: '{name} can no longer manage this challenge',
          },
          { name: displayName }
        )
      )
    } catch (error) {
      logger.error('Failed to revoke challenge role', { userId, challengeId, error })
      toast.error(
        t({
          id: 'manageChallengeDetail.managers.removeFailed',
          defaultMessage: 'Could not remove that manager',
        })
      )
    }
  }

  return (
    <ManagersPanel
      title={t({
        id: 'manageChallengeDetail.managers.title',
        defaultMessage: 'Challenge managers',
      })}
      description={t({
        id: 'manageChallengeDetail.managers.description',
        defaultMessage:
          'Give someone a role on this challenge alone. Anyone who manages the parent project, or the team that owns this challenge, already has access and is not listed here.',
      })}
      managers={managers?.map(({ userId, name, role }) => ({ userId, name, role }))}
      isLoading={isLoading}
      teams={teamManagers?.map(({ team }) => team)}
      isSettingRole={setUserRole.isPending}
      addedMessage={(name) =>
        t(
          {
            id: 'manageChallengeDetail.managers.added',
            defaultMessage: '{name} can now manage this challenge',
          },
          { name }
        )
      }
      setUserRole={(userId, role) => setUserRole.mutateAsync({ challengeId, userId, role })}
      removeUser={(manager) => handleRemove(manager.userId, manager.name)}
      addTeam={(teamId) =>
        setTeamRole.mutateAsync({ challengeId, teamId, role: TEAM_ATTACHMENT_ROLE })
      }
      removeTeam={(teamId) => removeTeam.mutate({ challengeId, teamId })}
    />
  )
}
