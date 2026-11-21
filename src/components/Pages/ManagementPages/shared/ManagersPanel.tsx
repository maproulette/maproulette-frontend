import { useQuery } from '@tanstack/react-query'
import { Trash2, UserPlus, Users } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import { toast } from 'sonner'
import { findTeamsOptions } from '@/api/team'
import { findUsersOptions } from '@/api/user'
import { OsmUserLink } from '@/components/shared/OsmUserLink'
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
import { PROJECT_ROLE, projectRoleOptions } from '@/lib/projectRoles'
import { initials } from '@/lib/utils'

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

interface Manager {
  userId: number
  name: string
  avatarURL?: string
  role: number
}

interface ManagersPanelProps {
  title: string
  /** Shown at the end of the title row */
  titleAction?: ReactNode
  description?: string
  managers: Manager[] | undefined
  isLoading: boolean
  teams: { id: number; name: string }[] | undefined
  isSettingRole: boolean
  /** Toast shown once a user or team has been added */
  addedMessage: (name: string) => string
  setUserRole: (userId: number, role: number) => Promise<unknown>
  removeUser: (manager: Manager) => void
  addTeam: (teamId: number) => Promise<unknown>
  removeTeam: (teamId: number) => void
}

/** Who can manage a project or challenge: individual users and whole teams. */
export const ManagersPanel = ({
  title,
  titleAction,
  description,
  managers,
  isLoading,
  teams,
  isSettingRole,
  addedMessage,
  setUserRole,
  removeUser,
  addTeam,
  removeTeam,
}: ManagersPanelProps) => {
  const { t } = useIntl()

  const [userQuery, setUserQuery] = useState('')
  const [newRole, setNewRole] = useState<number>(PROJECT_ROLE.write)
  const addManagerId = useId()
  const debouncedUserQuery = useDebouncedValue(userQuery)
  const { data: userMatches } = useQuery({
    ...findUsersOptions(debouncedUserQuery, 10),
    enabled: debouncedUserQuery.length > 2,
  })

  const [teamQuery, setTeamQuery] = useState('')
  const addTeamId = useId()
  const debouncedTeamQuery = useDebouncedValue(teamQuery)
  const { data: teamMatches } = useQuery({
    ...findTeamsOptions(debouncedTeamQuery, 10),
    enabled: debouncedTeamQuery.length > 2,
  })
  // A team that's already listed is edited there, not added again
  const existingTeamIds = new Set((teams ?? []).map((team) => team.id))
  const newTeamMatches = (teamMatches ?? []).filter((match) => !existingTeamIds.has(match.id))

  const handleAddUser = async (userId: number, displayName: string) => {
    try {
      await setUserRole(userId, newRole)
      setUserQuery('')
      toast.success(addedMessage(displayName))
    } catch (error) {
      logger.error('Failed to add manager', { userId, error })
      toast.error(t({ id: 'managers.addFailed', defaultMessage: 'Could not add that manager' }))
    }
  }

  const handleAddTeam = async (teamId: number, teamName: string) => {
    try {
      await addTeam(teamId)
      setTeamQuery('')
      toast.success(addedMessage(teamName))
    } catch (error) {
      logger.error('Failed to add team', { teamId, error })
      toast.error(t({ id: 'managers.addTeamFailed', defaultMessage: 'Could not add that team' }))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-fg-subtle" />
        <h3 className="font-medium text-fg text-sm">{title}</h3>
        {titleAction}
      </div>
      {description && <p className="text-fg-muted text-xs">{description}</p>}

      {isLoading ? (
        <Loader message={t({ id: 'managers.loading', defaultMessage: 'Loading managers...' })} />
      ) : (
        <ul className="space-y-2">
          {(managers ?? []).map((manager) => (
            <li key={manager.userId} className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage src={manager.avatarURL} alt={manager.name} />
                <AvatarFallback>{initials(manager.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm">
                <OsmUserLink username={manager.name} className="hover:underline" />
              </span>
              <RoleSelect
                value={manager.role}
                disabled={isSettingRole}
                onChange={(role) => setUserRole(manager.userId, role)}
              />
              <button
                type="button"
                className="rounded p-1.5 text-fg-subtle hover:text-danger"
                onClick={() => removeUser(manager)}
                aria-label={t(
                  { id: 'common.removeWithName', defaultMessage: 'Remove {name}' },
                  { name: manager.name }
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {managers?.length === 0 && (
            <li className="text-fg-muted text-sm">
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
          <ul className="max-h-40 overflow-y-auto rounded-md border border-line">
            {(userMatches ?? []).map((match) => (
              <li key={match.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => handleAddUser(match.id, match.displayName)}
                >
                  <UserPlus className="h-3.5 w-3.5 text-fg-subtle" />
                  {match.displayName}
                </button>
              </li>
            ))}
            {userMatches?.length === 0 && (
              <li className="px-2 py-1.5 text-fg-muted text-sm">
                {t({ id: 'managers.noMatches', defaultMessage: 'No matching users' })}
              </li>
            )}
          </ul>
        )}
      </div>

      <Separator />
      <h4 className="font-medium text-fg text-sm">
        {t({ id: 'common.teams', defaultMessage: 'Teams' })}
      </h4>
      <p className="text-fg-muted text-xs">
        {t({
          id: 'managers.teamsDescription',
          defaultMessage:
            'Team owners and admins get admin access, and team managers get write access. Other team members get no access.',
        })}
      </p>
      <ul className="space-y-2">
        {(teams ?? []).map((team) => (
          <li key={team.id} className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-fg-subtle" />
            <span className="min-w-0 flex-1 truncate text-sm">{team.name}</span>
            <button
              type="button"
              className="rounded p-1.5 text-fg-subtle hover:text-danger"
              onClick={() => removeTeam(team.id)}
              aria-label={t(
                { id: 'common.removeWithName', defaultMessage: 'Remove {name}' },
                { name: team.name }
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {teams?.length === 0 && (
          <li className="text-fg-muted text-sm">
            {t({ id: 'managers.noTeams', defaultMessage: 'No teams yet.' })}
          </li>
        )}
      </ul>

      <div className="space-y-2">
        <Label htmlFor={addTeamId}>
          {t({ id: 'managers.addTeamLabel', defaultMessage: 'Add a team' })}
        </Label>
        <Input
          id={addTeamId}
          value={teamQuery}
          onChange={(e) => setTeamQuery(e.target.value)}
          placeholder={t({ id: 'managers.teamSearchPlaceholder', defaultMessage: 'Team name' })}
        />
        {teamQuery.length > 2 && (
          <ul className="max-h-40 overflow-y-auto rounded-md border border-line">
            {newTeamMatches.map((match) => (
              <li key={match.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => handleAddTeam(match.id, match.name)}
                >
                  <Users className="h-3.5 w-3.5 text-fg-subtle" />
                  {match.name}
                </button>
              </li>
            ))}
            {newTeamMatches.length === 0 && (
              <li className="px-2 py-1.5 text-fg-muted text-sm">
                {t({ id: 'managers.noTeamMatches', defaultMessage: 'No matching teams' })}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
