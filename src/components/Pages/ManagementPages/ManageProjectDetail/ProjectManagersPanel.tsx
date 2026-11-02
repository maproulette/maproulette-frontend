import { Trash2, UserPlus, Users } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { DocsLink } from '@/components/shared/DocsLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
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
import {
  PROJECT_ROLE,
  projectRoleOptions,
  strongestRole,
  TEAM_ATTACHMENT_ROLE,
} from '@/lib/projectRoles'
import { initials } from '@/lib/utils'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'

/** Role picker shared by the user and team rows. */
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
 * Who can manage this project: individual users and whole teams, each with a
 * role. Roles govern access whether or not they can be edited here, so the
 * panel shows them even when the viewer cannot change them.
 */
export const ProjectManagersPanel = () => {
  const { t } = useIntl()
  const { projectId } = useManageProjectDetailContext()
  const id = Number(projectId)

  const { data: managers, isLoading } = api.project.managers(id)
  const { data: teamManagers } = api.project.teamManagers(id)
  const setUserRole = api.project.useSetUserProjectRole()
  const removeUser = api.project.useRemoveUserFromProject()
  const setTeamRole = api.project.useSetTeamProjectRole()
  const removeTeam = api.project.useRemoveTeamFromProject()

  const [userQuery, setUserQuery] = useState('')
  const [newRole, setNewRole] = useState<number>(PROJECT_ROLE.write)
  const addManagerId = useId()
  const debouncedUserQuery = useDebouncedValue(userQuery)
  const { data: userMatches } = api.user.findUsers(
    debouncedUserQuery,
    10,
    debouncedUserQuery.length > 2
  )

  const [teamQuery, setTeamQuery] = useState('')
  const addTeamId = useId()
  const debouncedTeamQuery = useDebouncedValue(teamQuery)
  const { data: teamMatches } = api.team.findTeamsByName(
    debouncedTeamQuery,
    10,
    debouncedTeamQuery.length > 2
  )
  // A team already managing the project is edited in the list above, not added
  // again, so keep those out of the results.
  const existingTeamIds = new Set((teamManagers ?? []).map(({ team }) => team.id))

  const handleAddUser = async (userId: number, displayName: string) => {
    try {
      await setUserRole.mutateAsync({ userId, projectId: id, role: newRole })
      setUserQuery('')
      toast.success(
        t(
          {
            id: 'manageProjectDetail.managers.added',
            defaultMessage: '{name} can now manage this project',
          },
          { name: displayName }
        )
      )
    } catch (error) {
      logger.error('Failed to grant project role', { userId, projectId: id, error })
      toast.error(
        t({
          id: 'managers.addFailed',
          defaultMessage: 'Could not add that manager',
        })
      )
    }
  }

  const handleAddTeam = async (teamId: number, teamName: string) => {
    try {
      await setTeamRole.mutateAsync({ teamId, projectId: id, role: TEAM_ATTACHMENT_ROLE })
      setTeamQuery('')
      toast.success(
        t(
          {
            id: 'manageProjectDetail.managers.added',
            defaultMessage: '{name} can now manage this project',
          },
          { name: teamName }
        )
      )
    } catch (error) {
      logger.error('Failed to grant team project role', { teamId, projectId: id, error })
      toast.error(
        t({
          id: 'managers.addTeamFailed',
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
          {t({ id: 'manageProjectDetail.managers.title', defaultMessage: 'Project managers' })}
        </h3>
        <DocsLink
          page="projectsAndProjectManagers"
          label={t({
            id: 'manageProjectDetail.managers.docsLink',
            defaultMessage: 'About project roles',
          })}
          className="ml-auto text-zinc-400 no-underline hover:text-zinc-600"
        />
      </div>

      {isLoading ? (
        <Loader
          message={t({
            id: 'managers.loading',
            defaultMessage: 'Loading managers...',
          })}
        />
      ) : (
        <ul className="space-y-2">
          {(managers ?? []).map((manager) => {
            const role = strongestRole(manager.roles) ?? PROJECT_ROLE.read
            return (
              <li key={manager.userId} className="flex items-center gap-2">
                <Avatar className="size-7">
                  <AvatarImage src={manager.avatarURL} alt={manager.displayName} />
                  <AvatarFallback>{initials(manager.displayName)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm">{manager.displayName}</span>
                <RoleSelect
                  value={role}
                  disabled={setUserRole.isPending}
                  onChange={(next) =>
                    setUserRole.mutate({ userId: manager.userId, projectId: id, role: next })
                  }
                />
                <button
                  type="button"
                  className="rounded p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => removeUser.mutate({ userId: manager.userId, projectId: id, role })}
                  aria-label={t(
                    { id: 'common.removeWithName', defaultMessage: 'Remove {name}' },
                    { name: manager.displayName }
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
          {managers?.length === 0 && (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">
              {t({ id: 'managers.none', defaultMessage: 'No managers yet.' })}
            </li>
          )}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor={addManagerId}>
          {t({ id: 'managers.addLabel', defaultMessage: 'Add a manager' })}
        </Label>
        <div className="flex gap-2">
          <Input
            id={addManagerId}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={t({
              id: 'managers.searchPlaceholder',
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
                  id: 'managers.noMatches',
                  defaultMessage: 'No matching users',
                })}
              </li>
            )}
          </ul>
        )}
      </div>

      <Separator />
      <h4 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
        {t({ id: 'common.teams', defaultMessage: 'Teams' })}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-slate-400">
        {t({
          id: 'managers.teamsDescription',
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
                onClick={() => removeTeam.mutate({ teamId: team.id, projectId: id })}
                aria-label={t(
                  {
                    id: 'common.removeWithName',
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
            {t({ id: 'managers.noTeams', defaultMessage: 'No teams yet.' })}
          </li>
        )}
      </ul>

      <div className="space-y-2">
        <Label htmlFor={addTeamId}>
          {t({ id: 'managers.addTeamLabel', defaultMessage: 'Add a team' })}
        </Label>
        <div className="flex gap-2">
          <Input
            id={addTeamId}
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            placeholder={t({
              id: 'managers.teamSearchPlaceholder',
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
                  id: 'managers.noTeamMatches',
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
