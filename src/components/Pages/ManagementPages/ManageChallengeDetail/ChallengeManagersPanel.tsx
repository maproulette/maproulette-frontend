import { Trash2, UserPlus, Users } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Loader } from '@/components/ui/Loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Separator } from '@/components/ui/Separator'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { PROJECT_ROLE, projectRoleOptions, TEAM_ATTACHMENT_ROLE } from '@/lib/projectRoles'
import { initials } from '@/lib/utils'

/** Role picker for a challenge manager. Roles are the same set a project grants. */
const RoleSelect = ({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled?: boolean
  onChange: (role: number) => void
}) => {
  const { t } = useIntl()
  return (
    <Select value={String(value)} disabled={disabled} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {projectRoleOptions.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {t(option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Who can manage this challenge in particular. A role granted here reaches only
 * this challenge -- it is for letting someone at one piece of work without
 * handing them the whole project. Anyone who already manages the parent project,
 * or manages the team that owns this challenge, gets in regardless and is not
 * listed here.
 */
export const ChallengeManagersPanel = ({ challengeId }: { challengeId: number }) => {
  const { t } = useIntl()
  const { data: managers, isLoading } = api.challenge.managers(challengeId)
  const setUserRole = api.challenge.useSetChallengeUserRole()
  const removeUser = api.challenge.useRemoveChallengeUser()

  const [userQuery, setUserQuery] = useState('')
  const [newRole, setNewRole] = useState<number>(PROJECT_ROLE.write)
  const addManagerId = useId()
  const debouncedUserQuery = useDebouncedValue(userQuery)
  const { data: userMatches } = api.user.findUsers(
    debouncedUserQuery,
    10,
    debouncedUserQuery.length > 2
  )

  const { data: teamManagers } = api.challenge.teamManagers(challengeId)
  const setTeamRole = api.challenge.useSetTeamChallengeRole()
  const removeTeam = api.challenge.useRemoveTeamFromChallenge()
  const [teamQuery, setTeamQuery] = useState('')
  const addTeamId = useId()
  const debouncedTeamQuery = useDebouncedValue(teamQuery)
  const { data: teamMatches } = api.team.findTeamsByName(
    debouncedTeamQuery,
    10,
    debouncedTeamQuery.length > 2
  )
  // A team already granted a role here is edited in the list above, not added
  // again, so keep those out of the results.
  const existingTeamIds = new Set((teamManagers ?? []).map(({ team }) => team.id))

  const handleAddUser = async (userId: number, displayName: string) => {
    try {
      await setUserRole.mutateAsync({ challengeId, userId, role: newRole })
      setUserQuery('')
      toast.success(
        t(
          {
            id: 'manageChallengeDetail.managers.added',
            defaultMessage: '{name} can now manage this challenge',
          },
          { name: displayName }
        )
      )
    } catch (error) {
      logger.error('Failed to grant challenge role', { userId, challengeId, error })
      toast.error(
        t({
          id: 'manageChallengeDetail.managers.addFailed',
          defaultMessage: 'Could not add that manager',
        })
      )
    }
  }

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

  const handleAddTeam = async (teamId: number, teamName: string) => {
    try {
      await setTeamRole.mutateAsync({ challengeId, teamId, role: TEAM_ATTACHMENT_ROLE })
      setTeamQuery('')
      toast.success(
        t(
          {
            id: 'manageChallengeDetail.managers.teamAdded',
            defaultMessage: '{name} can now manage this challenge',
          },
          { name: teamName }
        )
      )
    } catch (error) {
      logger.error('Failed to grant challenge team role', { teamId, challengeId, error })
      toast.error(
        t({
          id: 'manageChallengeDetail.managers.addTeamFailed',
          defaultMessage: 'Could not add that team',
        })
      )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-zinc-500" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t({ id: 'manageChallengeDetail.managers.title', defaultMessage: 'Challenge managers' })}
        </h3>
      </div>
      <p className="text-xs text-zinc-500 dark:text-slate-400">
        {t({
          id: 'manageChallengeDetail.managers.description',
          defaultMessage:
            'Give someone a role on this challenge alone. Anyone who manages the parent project, or the team that owns this challenge, already has access and is not listed here.',
        })}
      </p>

      {isLoading ? (
        <Loader
          message={t({
            id: 'manageChallengeDetail.managers.loading',
            defaultMessage: 'Loading managers...',
          })}
        />
      ) : (
        <ul className="space-y-2">
          {(managers ?? []).map((manager) => (
            <li key={manager.userId} className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback>{initials(manager.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm">{manager.name}</span>
              <RoleSelect
                value={manager.role}
                disabled={setUserRole.isPending}
                onChange={(next) =>
                  setUserRole.mutate({ challengeId, userId: manager.userId, role: next })
                }
              />
              <button
                type="button"
                className="rounded p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => handleRemove(manager.userId, manager.name)}
                aria-label={t(
                  { id: 'manageChallengeDetail.managers.remove', defaultMessage: 'Remove {name}' },
                  { name: manager.name }
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {managers?.length === 0 && (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">
              {t({ id: 'manageChallengeDetail.managers.none', defaultMessage: 'No managers yet.' })}
            </li>
          )}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor={addManagerId}>
          {t({ id: 'manageChallengeDetail.managers.addLabel', defaultMessage: 'Add a manager' })}
        </Label>
        <div className="flex gap-2">
          <Input
            id={addManagerId}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={t({
              id: 'manageChallengeDetail.managers.searchPlaceholder',
              defaultMessage: 'OpenStreetMap username',
            })}
          />
          <RoleSelect value={newRole} onChange={setNewRole} />
        </div>
        {userQuery.length > 2 && (
          <ul className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 dark:border-slate-700">
            {(userMatches ?? []).map((match) => (
              <li key={match.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-slate-800"
                  onClick={() => handleAddUser(match.id, match.displayName)}
                >
                  <UserPlus className="h-3.5 w-3.5 text-zinc-400" />
                  {match.displayName}
                </button>
              </li>
            ))}
            {userMatches?.length === 0 && (
              <li className="px-2 py-1.5 text-sm text-zinc-500">
                {t({
                  id: 'manageChallengeDetail.managers.noMatches',
                  defaultMessage: 'No matching users',
                })}
              </li>
            )}
          </ul>
        )}
      </div>

      <Separator />
      <h4 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
        {t({ id: 'manageChallengeDetail.managers.teamsTitle', defaultMessage: 'Teams' })}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-slate-400">
        {t({
          id: 'manageChallengeDetail.managers.teamsDescription',
          defaultMessage:
            'What each person can do here follows their role in the team: owners and admins manage it, managers can edit, and plain members get nothing.',
        })}
      </p>
      <ul className="space-y-2">
        {(teamManagers ?? []).map(({ team }) => {
          return (
            <li key={team.id} className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-purple-400" />
              <span className="min-w-0 flex-1 truncate text-sm">{team.name}</span>
              <button
                type="button"
                className="rounded p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => removeTeam.mutate({ challengeId, teamId: team.id })}
                aria-label={t(
                  {
                    id: 'manageChallengeDetail.managers.removeTeam',
                    defaultMessage: 'Remove {name}',
                  },
                  { name: team.name }
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          )
        })}
        {teamManagers?.length === 0 && (
          <li className="text-sm text-zinc-500 dark:text-zinc-400">
            {t({ id: 'manageChallengeDetail.managers.noTeams', defaultMessage: 'No teams yet.' })}
          </li>
        )}
      </ul>

      <div className="space-y-2">
        <Label htmlFor={addTeamId}>
          {t({ id: 'manageChallengeDetail.managers.addTeamLabel', defaultMessage: 'Add a team' })}
        </Label>
        <div className="flex gap-2">
          <Input
            id={addTeamId}
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            placeholder={t({
              id: 'manageChallengeDetail.managers.teamSearchPlaceholder',
              defaultMessage: 'Team name',
            })}
          />
        </div>
        {teamQuery.length > 2 && (
          <ul className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 dark:border-slate-700">
            {(teamMatches ?? [])
              .filter((match) => !existingTeamIds.has(match.id))
              .map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-slate-800"
                    onClick={() => handleAddTeam(match.id, match.name)}
                  >
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    {match.name}
                  </button>
                </li>
              ))}
            {(teamMatches ?? []).filter((match) => !existingTeamIds.has(match.id)).length === 0 && (
              <li className="px-2 py-1.5 text-sm text-zinc-500">
                {t({
                  id: 'manageChallengeDetail.managers.noTeamMatches',
                  defaultMessage: 'No matching teams',
                })}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
