import { useNavigate } from '@tanstack/react-router'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import type { Team, TeamUser } from '@/types/Team'
import {
  isPendingInvite,
  roleManagesMembers,
  roleOwnsTeam,
  TEAM_ROLE_OWNER,
  teamRoleOf,
} from '@/types/Team'

type TeamDetailContextType = {
  teamId: number
  team: Team | undefined
  isLoading: boolean
  /** Everyone on the team, those still holding an invitation included. */
  members: TeamUser[]
  joined: TeamUser[]
  invited: TeamUser[]
  iAmAdmin: boolean
  iAmOwner: boolean
  /**
   * A team must always keep someone able to delete it, so its sole owner
   * cannot be demoted or removed. The backend refuses either way; the controls
   * say so rather than letting the attempt fail.
   */
  lastOwnerId: number | undefined
  currentUserId: number | undefined
  inviteOpen: boolean
  setInviteOpen: (open: boolean) => void
  confirmDelete: boolean
  setConfirmDelete: (open: boolean) => void
  handleDelete: () => Promise<void>
}

const TeamDetailContext = createContext<TeamDetailContextType | undefined>(undefined)

export const TeamDetailProvider = ({
  teamId,
  children,
}: {
  teamId: number
  children: ReactNode
}) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { data: team, isLoading } = api.team.get(teamId)
  const { data: members = [] } = api.team.members(teamId)
  const deleteTeam = api.team.useDeleteTeam()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const value = useMemo<TeamDetailContextType>(() => {
    const me = members.find((m) => m.userId === user?.id)
    const myRole = me && !isPendingInvite(me) ? teamRoleOf(me) : undefined
    const joined = members.filter((m) => !isPendingInvite(m))
    const invited = members.filter((m) => isPendingInvite(m))
    const owners = joined.filter((m) => teamRoleOf(m) === TEAM_ROLE_OWNER)

    const handleDelete = async () => {
      try {
        await deleteTeam.mutateAsync(teamId)
        toast.success(t('teams.detail.deleteSuccess', undefined, 'Team deleted'))
        navigate({ to: '/dashboard' })
      } catch (error) {
        logger.error('Team delete failed', { error })
        toast.error(t('teams.detail.deleteError', undefined, 'Could not delete team'))
      }
    }

    return {
      teamId,
      team,
      isLoading,
      members,
      joined,
      invited,
      iAmAdmin: myRole !== undefined && roleManagesMembers(myRole),
      iAmOwner: myRole !== undefined && roleOwnsTeam(myRole),
      lastOwnerId: owners.length === 1 ? owners[0].userId : undefined,
      currentUserId: user?.id,
      inviteOpen,
      setInviteOpen,
      confirmDelete,
      setConfirmDelete,
      handleDelete,
    }
  }, [
    teamId,
    team,
    isLoading,
    members,
    user?.id,
    inviteOpen,
    confirmDelete,
    deleteTeam,
    navigate,
    t,
  ])

  return <TeamDetailContext.Provider value={value}>{children}</TeamDetailContext.Provider>
}

export const useTeamDetailContext = () => {
  const context = useContext(TeamDetailContext)

  if (context === undefined) {
    throw new Error('useTeamDetailContext must be used within a TeamDetailProvider')
  }

  return context
}
