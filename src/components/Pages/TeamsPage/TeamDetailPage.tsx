import { Link, useNavigate } from '@tanstack/react-router'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { initials } from '@/lib/utils'
import type { TeamRole, TeamUser } from '@/types/Team'
import {
  TEAM_ROLE_ADMIN,
  TEAM_ROLE_MEMBER,
  TeamDisplayRoleLabel,
  teamDisplayRole,
} from '@/types/Team'
import { InviteMemberDialog } from './InviteMemberDialog'

interface Props {
  teamId: number
}

const MemberRow = ({
  member,
  isAdmin,
  currentUserId,
  teamId,
}: {
  member: TeamUser
  isAdmin: boolean
  currentUserId: number | undefined
  teamId: number
}) => {
  const { t } = useIntl()
  const changeRole = api.team.useChangeRole()
  const removeMember = api.team.useRemoveMember()

  const handleRole = async (role: TeamRole) => {
    try {
      await changeRole.mutateAsync({ teamId, userId: member.userId, role })
      toast.success(t('teams.detail.roleUpdateSuccess', undefined, 'Role updated'))
    } catch (error) {
      logger.error('Role change failed', { error })
      toast.error(t('teams.detail.roleUpdateError', undefined, 'Could not update role'))
    }
  }

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync({ teamId, userId: member.userId })
      toast.success(t('teams.detail.memberRemoveSuccess', undefined, 'Member removed'))
    } catch (error) {
      logger.error('Remove failed', { error })
      toast.error(t('teams.detail.memberRemoveError', undefined, 'Could not remove member'))
    }
  }

  const role = teamDisplayRole(member)

  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <Avatar className="size-9">
        <AvatarFallback>{initials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{member.name}</div>
        <div className="text-xs text-zinc-500 dark:text-slate-400">
          {TeamDisplayRoleLabel[role]}
        </div>
      </div>
      {isAdmin && member.userId !== currentUserId && (
        <div className="flex gap-1">
          {role === 'member' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRole(TEAM_ROLE_ADMIN)}
              disabled={changeRole.isPending}
            >
              {t('teams.detail.promoteButton', undefined, 'Promote')}
            </Button>
          )}
          {role === 'admin' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRole(TEAM_ROLE_MEMBER)}
              disabled={changeRole.isPending}
            >
              {t('teams.detail.demoteButton', undefined, 'Demote')}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={removeMember.isPending}
            aria-label={t('teams.detail.removeMemberAriaLabel', undefined, 'Remove member')}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </li>
  )
}

export const TeamDetailPage = ({ teamId }: Props) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { data: team, isLoading } = api.team.get(teamId)
  const { data: members = [] } = api.team.members(teamId)
  const deleteTeam = api.team.useDeleteTeam()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <Loader />
  if (!team) {
    return (
      <div className="py-12 text-center text-zinc-500">
        {t('common.teamNotFound', undefined, 'Team not found.')}
      </div>
    )
  }

  const me = members.find((m) => m.userId === user?.id)
  const iAmAdmin = me !== undefined && teamDisplayRole(me) === 'admin'

  const admins = members.filter((m) => teamDisplayRole(m) === 'admin')
  const regularMembers = members.filter((m) => teamDisplayRole(m) === 'member')
  const invited = members.filter((m) => teamDisplayRole(m) === 'invited')

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <Avatar className="size-16">
            <AvatarImage src={team.avatarURL ?? ''} alt={team.name} />
            <AvatarFallback>{initials(team.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-xl">{team.name}</h1>
            {team.description && (
              <p className="mt-1 max-w-prose text-sm text-zinc-600 dark:text-slate-400">
                {team.description}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500 dark:text-slate-500">
              {t(
                'teams.detail.memberCount',
                { count: members.length },
                '{count, plural, one {# member} other {# members}}'
              )}
            </p>
          </div>
        </div>
        {iAmAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/teams/$teamId/edit" params={{ teamId: String(teamId) }}>
                <Pencil className="size-4" aria-hidden="true" />{' '}
                {t('common.edit', undefined, 'Edit')}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" aria-hidden="true" />{' '}
              {t('teams.detail.inviteButton', undefined, 'Invite')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" aria-hidden="true" />{' '}
              {t('common.delete', undefined, 'Delete')}
            </Button>
          </div>
        )}
      </div>

      {admins.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium text-sm text-zinc-700 dark:text-slate-300">
            {t('teams.detail.adminsHeading', undefined, 'Admins')}
          </h2>
          <ul className="space-y-2">
            {admins.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isAdmin={iAmAdmin}
                currentUserId={user?.id}
                teamId={teamId}
              />
            ))}
          </ul>
        </section>
      )}

      {regularMembers.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium text-sm text-zinc-700 dark:text-slate-300">
            {t('teams.detail.membersHeading', undefined, 'Members')}
          </h2>
          <ul className="space-y-2">
            {regularMembers.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isAdmin={iAmAdmin}
                currentUserId={user?.id}
                teamId={teamId}
              />
            ))}
          </ul>
        </section>
      )}

      {invited.length > 0 && iAmAdmin && (
        <section className="space-y-2">
          <h2 className="font-medium text-sm text-zinc-700 dark:text-slate-300">
            {t('common.invited', undefined, 'Invited')}
          </h2>
          <ul className="space-y-2">
            {invited.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isAdmin={iAmAdmin}
                currentUserId={user?.id}
                teamId={teamId}
              />
            ))}
          </ul>
        </section>
      )}

      <InviteMemberDialog teamId={teamId} open={inviteOpen} onOpenChange={setInviteOpen} />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('teams.detail.deleteConfirmTitle', undefined, 'Delete this team?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'teams.detail.deleteConfirmDescription',
                undefined,
                'This cannot be undone. All members will lose access.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t('teams.detail.deleteConfirmAction', undefined, 'Delete team')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
