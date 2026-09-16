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
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { PROJECT_ROLE, projectRoleOptions, strongestRole } from '@/lib/projectRoles'
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
}) => (
  <Select value={String(value)} disabled={disabled} onValueChange={(v) => onChange(Number(v))}>
    <SelectTrigger size="sm" className="w-28">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {projectRoleOptions.map((option) => (
        <SelectItem key={option.value} value={String(option.value)}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

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
  const { data: userMatches } = api.user.findUsers(userQuery, 10, userQuery.length > 2)

  const { data: teamManagers } = api.challenge.teamManagers(challengeId)
  const setTeamRole = api.challenge.useSetTeamChallengeRole()
  const removeTeam = api.challenge.useRemoveTeamFromChallenge()
  const [teamQuery, setTeamQuery] = useState('')
  const [newTeamRole, setNewTeamRole] = useState<number>(PROJECT_ROLE.write)
  const addTeamId = useId()
  const { data: teamMatches } = api.team.findTeamsByName(teamQuery, 10, teamQuery.length > 2)
  // A team already granted a role here is edited in the list above, not added
  // again, so keep those out of the results.
  const existingTeamIds = new Set((teamManagers ?? []).map(({ team }) => team.id))

  const handleAddUser = async (userId: number, displayName: string) => {
    try {
      await setUserRole.mutateAsync({ challengeId, userId, role: newRole })
      setUserQuery('')
      toast.success(
        t(
          'manageChallengeDetail.managers.added',
          { name: displayName },
          '{name} can now manage this challenge'
        )
      )
    } catch (error) {
      logger.error('Failed to grant challenge role', { userId, challengeId, error })
      toast.error(
        t('manageChallengeDetail.managers.addFailed', undefined, 'Could not add that manager')
      )
    }
  }

  const handleRemove = async (userId: number, displayName: string) => {
    try {
      await removeUser.mutateAsync({ challengeId, userId })
      toast.success(
        t(
          'manageChallengeDetail.managers.removed',
          { name: displayName },
          '{name} can no longer manage this challenge'
        )
      )
    } catch (error) {
      logger.error('Failed to revoke challenge role', { userId, challengeId, error })
      toast.error(
        t('manageChallengeDetail.managers.removeFailed', undefined, 'Could not remove that manager')
      )
    }
  }

  const handleAddTeam = async (teamId: number, teamName: string) => {
    try {
      await setTeamRole.mutateAsync({ challengeId, teamId, role: newTeamRole })
      setTeamQuery('')
      toast.success(
        t(
          'manageChallengeDetail.managers.teamAdded',
          { name: teamName },
          '{name} can now manage this challenge'
        )
      )
    } catch (error) {
      logger.error('Failed to grant challenge team role', { teamId, challengeId, error })
      toast.error(
        t('manageChallengeDetail.managers.addTeamFailed', undefined, 'Could not add that team')
      )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-zinc-500" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t('manageChallengeDetail.managers.title', undefined, 'Challenge managers')}
        </h3>
      </div>
      <p className="text-xs text-zinc-500 dark:text-slate-400">
        {t(
          'manageChallengeDetail.managers.description',
          undefined,
          'Give someone a role on this challenge alone. Anyone who manages the parent project, or the team that owns this challenge, already has access and is not listed here.'
        )}
      </p>

      {isLoading ? (
        <Loader
          message={t('manageChallengeDetail.managers.loading', undefined, 'Loading managers...')}
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
                  'manageChallengeDetail.managers.remove',
                  { name: manager.name },
                  'Remove {name}'
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {managers?.length === 0 && (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('manageChallengeDetail.managers.none', undefined, 'No managers yet.')}
            </li>
          )}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor={addManagerId}>
          {t('manageChallengeDetail.managers.addLabel', undefined, 'Add a manager')}
        </Label>
        <div className="flex gap-2">
          <Input
            id={addManagerId}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={t(
              'manageChallengeDetail.managers.searchPlaceholder',
              undefined,
              'OpenStreetMap username'
            )}
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
                {t('manageChallengeDetail.managers.noMatches', undefined, 'No matching users')}
              </li>
            )}
          </ul>
        )}
      </div>

      <Separator />
      <h4 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
        {t('manageChallengeDetail.managers.teamsTitle', undefined, 'Teams')}
      </h4>
      <ul className="space-y-2">
        {(teamManagers ?? []).map(({ team, roles }) => {
          const role = strongestRole(roles) ?? PROJECT_ROLE.read
          return (
            <li key={team.id} className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-purple-400" />
              <span className="min-w-0 flex-1 truncate text-sm">{team.name}</span>
              <RoleSelect
                value={role}
                disabled={setTeamRole.isPending}
                onChange={(next) =>
                  setTeamRole.mutate({ challengeId, teamId: team.id, role: next })
                }
              />
              <button
                type="button"
                className="rounded p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => removeTeam.mutate({ challengeId, teamId: team.id })}
                aria-label={t(
                  'manageChallengeDetail.managers.removeTeam',
                  { name: team.name },
                  'Remove {name}'
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          )
        })}
        {teamManagers?.length === 0 && (
          <li className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('manageChallengeDetail.managers.noTeams', undefined, 'No teams yet.')}
          </li>
        )}
      </ul>

      <div className="space-y-2">
        <Label htmlFor={addTeamId}>
          {t('manageChallengeDetail.managers.addTeamLabel', undefined, 'Add a team')}
        </Label>
        <div className="flex gap-2">
          <Input
            id={addTeamId}
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            placeholder={t(
              'manageChallengeDetail.managers.teamSearchPlaceholder',
              undefined,
              'Team name'
            )}
          />
          <RoleSelect value={newTeamRole} onChange={setNewTeamRole} />
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
                {t('manageChallengeDetail.managers.noTeamMatches', undefined, 'No matching teams')}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
