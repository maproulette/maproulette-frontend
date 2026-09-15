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
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { Loader } from '@/components/ui/Loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useAuthContext } from '@/contexts/AuthContext'
import { type TranslateFn, useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { initials } from '@/lib/utils'
import type { TeamRole, TeamUser } from '@/types/Team'
import {
  isPendingInvite,
  roleDisplayName,
  roleManagesMembers,
  roleOwnsTeam,
  TEAM_ROLE_ADMIN,
  TEAM_ROLE_MANAGER,
  TEAM_ROLE_MEMBER,
  TEAM_ROLE_OWNER,
  TEAM_ROLES,
  TeamDisplayRoleLabel,
  teamDisplayRole,
  teamRoleOf,
} from '@/types/Team'
import { InviteMemberDialog } from './InviteMemberDialog'
import { TeamImagesSection } from './TeamImagesSection'

interface Props {
  teamId: number
}

// Members are grouped by role, most privileged first, so the shape of a team
// reads off the page. Each heading is a literal `t` call rather than an id in
// a table, so the message extractor can still find them.
const ROLE_SECTIONS: { role: TeamRole; heading: (t: TranslateFn) => string }[] = [
  { role: TEAM_ROLE_OWNER, heading: (t) => t('teams.detail.ownersHeading', undefined, 'Owners') },
  { role: TEAM_ROLE_ADMIN, heading: (t) => t('teams.detail.adminsHeading', undefined, 'Admins') },
  {
    role: TEAM_ROLE_MANAGER,
    heading: (t) => t('teams.detail.managersHeading', undefined, 'Managers'),
  },
  {
    role: TEAM_ROLE_MEMBER,
    heading: (t) => t('teams.detail.membersHeading', undefined, 'Members'),
  },
]

const MemberRow = ({
  member,
  isAdmin,
  canAssignOwner,
  isLastOwner,
  currentUserId,
  teamId,
}: {
  member: TeamUser
  isAdmin: boolean
  /** Only an owner may hand out the owner role, so only they see it offered. */
  canAssignOwner: boolean
  /** A team always needs someone who can delete it, so its last owner is fixed in place. */
  isLastOwner: boolean
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
        <div className="flex items-center gap-1">
          <DisabledTooltip
            show={isLastOwner}
            message={t(
              'teams.detail.lastOwnerReason',
              undefined,
              'A team needs an owner. Make someone else an owner before changing this one.'
            )}
          >
            <Select
              value={String(teamRoleOf(member))}
              onValueChange={(value) => handleRole(Number(value) as TeamRole)}
              disabled={changeRole.isPending || isLastOwner}
            >
              <SelectTrigger
                size="sm"
                className="w-32"
                aria-label={t('teams.detail.roleLabel', undefined, 'Role')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.filter((option) => option !== TEAM_ROLE_OWNER || canAssignOwner).map(
                  (option) => (
                    <SelectItem key={option} value={String(option)}>
                      {TeamDisplayRoleLabel[roleDisplayName(option)]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </DisabledTooltip>
          <DisabledTooltip
            show={isLastOwner}
            message={t(
              'teams.detail.lastOwnerRemoveReason',
              undefined,
              'A team needs an owner. Make someone else an owner before removing this one.'
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={removeMember.isPending || isLastOwner}
              aria-label={t('teams.detail.removeMemberAriaLabel', undefined, 'Remove member')}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </DisabledTooltip>
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
  const myRole = me && !isPendingInvite(me) ? teamRoleOf(me) : undefined
  const iAmAdmin = myRole !== undefined && roleManagesMembers(myRole)
  const iAmOwner = myRole !== undefined && roleOwnsTeam(myRole)

  const joined = members.filter((m) => !isPendingInvite(m))
  const invited = members.filter((m) => isPendingInvite(m))
  const owners = joined.filter((m) => teamRoleOf(m) === TEAM_ROLE_OWNER)
  // A team must always keep someone able to delete it, so its sole owner
  // cannot be demoted or removed - the backend refuses either way, and the
  // controls say so rather than letting the attempt fail.
  const lastOwnerId = owners.length === 1 ? owners[0].userId : undefined

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
            <DisabledTooltip
              show={!iAmOwner}
              message={t(
                'teams.detail.deleteDisabledReason',
                undefined,
                'Only an owner of the team can delete it'
              )}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={!iAmOwner}
              >
                <Trash2 className="size-4" aria-hidden="true" />{' '}
                {t('common.delete', undefined, 'Delete')}
              </Button>
            </DisabledTooltip>
          </div>
        )}
      </div>

      <TeamImagesSection teamId={teamId} isAdmin={iAmAdmin} currentUserId={user?.id} />

      {ROLE_SECTIONS.map(({ role, heading }) => {
        const roleMembers = joined.filter((m) => teamRoleOf(m) === role)
        if (roleMembers.length === 0) return null
        return (
          <section key={role} className="space-y-2">
            <h2 className="font-medium text-sm text-zinc-700 dark:text-slate-300">{heading(t)}</h2>
            <ul className="space-y-2">
              {roleMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isAdmin={iAmAdmin}
                  canAssignOwner={iAmOwner}
                  isLastOwner={m.userId === lastOwnerId}
                  currentUserId={user?.id}
                  teamId={teamId}
                />
              ))}
            </ul>
          </section>
        )
      })}

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
                canAssignOwner={iAmOwner}
                isLastOwner={false}
                currentUserId={user?.id}
                teamId={teamId}
              />
            ))}
          </ul>
        </section>
      )}

      <InviteMemberDialog
        teamId={teamId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        canAssignOwner={iAmOwner}
      />
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
