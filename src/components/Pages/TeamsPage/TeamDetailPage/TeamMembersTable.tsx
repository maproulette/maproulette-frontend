import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { initials } from '@/lib/utils'
import type { TeamRole, TeamUser } from '@/types/Team'
import {
  isPendingInvite,
  roleDisplayName,
  TEAM_ROLE_OWNER,
  TEAM_ROLES,
  TeamDisplayRoleLabel,
  teamDisplayRole,
  teamRoleOf,
} from '@/types/Team'
import { useTeamDetailContext } from './TeamDetailContext'

const MemberRow = ({ member }: { member: TeamUser }) => {
  const { t } = useIntl()
  const { teamId, iAmAdmin, iAmOwner, lastOwnerId, currentUserId } = useTeamDetailContext()
  const changeRole = api.team.useChangeRole()
  const removeMember = api.team.useRemoveMember()

  const isLastOwner = member.userId === lastOwnerId
  const pending = isPendingInvite(member)

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

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>{initials(member.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium">{member.name}</span>
        </div>
      </TableCell>
      <TableCell>{TeamDisplayRoleLabel[teamDisplayRole(member)]}</TableCell>
      <TableCell>
        {pending ? (
          <Badge variant="secondary">{t('common.invited', undefined, 'Invited')}</Badge>
        ) : (
          <Badge variant="success">{t('teams.detail.statusJoined', undefined, 'Joined')}</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {iAmAdmin && member.userId !== currentUserId && (
          <div className="flex items-center justify-end gap-1">
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
                  {TEAM_ROLES.filter((option) => option !== TEAM_ROLE_OWNER || iAmOwner).map(
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
      </TableCell>
    </TableRow>
  )
}

/**
 * The Users tab: everyone on the team in one table, those still holding an
 * invitation included. Grouping by role gave way to a Role column, so a team
 * large enough to need scanning reads in one pass.
 */
export const TeamMembersTable = () => {
  const { t } = useIntl()
  const { joined, invited, iAmAdmin } = useTeamDetailContext()

  // An outsider has no business seeing who has merely been asked to join.
  const rows = iAmAdmin ? [...joined, ...invited] : joined

  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500 dark:text-slate-400">
        {t('teams.detail.noMembers', undefined, 'This team has no members yet.')}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('teams.detail.columnName', undefined, 'Name')}</TableHead>
            <TableHead>{t('teams.detail.roleLabel', undefined, 'Role')}</TableHead>
            <TableHead>{t('common.status', undefined, 'Status')}</TableHead>
            <TableHead className="text-right">
              {t('common.actions', undefined, 'Actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
