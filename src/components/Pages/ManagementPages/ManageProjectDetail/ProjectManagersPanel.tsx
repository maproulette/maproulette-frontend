import { Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
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
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { PROJECT_ROLE, projectRoleOptions, strongestRole } from '@/lib/projectRoles'
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
  const { data: userMatches } = api.user.findUsers(userQuery, 10, userQuery.length > 2)

  const handleAddUser = async (userId: number, displayName: string) => {
    try {
      await setUserRole.mutateAsync({ userId, projectId: id, role: newRole })
      setUserQuery('')
      toast.success(
        t(
          'manageProjectDetail.managers.added',
          { name: displayName },
          '{name} can now manage this project'
        )
      )
    } catch (error) {
      logger.error('Failed to grant project role', { userId, projectId: id, error })
      toast.error(
        t('manageProjectDetail.managers.addFailed', undefined, 'Could not add that manager')
      )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-zinc-500" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t('manageProjectDetail.managers.title', undefined, 'Project managers')}
        </h3>
        <DocsLink
          page="projectsAndProjectManagers"
          label={t('manageProjectDetail.managers.docsLink', undefined, 'About project roles')}
          className="ml-auto text-zinc-400 no-underline hover:text-zinc-600"
        />
      </div>

      {isLoading ? (
        <Loader
          message={t('manageProjectDetail.managers.loading', undefined, 'Loading managers...')}
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
                    'manageProjectDetail.managers.remove',
                    { name: manager.displayName },
                    'Remove {name}'
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
          {managers?.length === 0 && (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('manageProjectDetail.managers.none', undefined, 'No managers yet.')}
            </li>
          )}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor="add-manager">
          {t('manageProjectDetail.managers.addLabel', undefined, 'Add a manager')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="add-manager"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={t(
              'manageProjectDetail.managers.searchPlaceholder',
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
                {t('manageProjectDetail.managers.noMatches', undefined, 'No matching users')}
              </li>
            )}
          </ul>
        )}
      </div>

      {(teamManagers?.length ?? 0) > 0 && (
        <>
          <Separator />
          <h4 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
            {t('manageProjectDetail.managers.teamsTitle', undefined, 'Teams')}
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
                      setTeamRole.mutate({ teamId: team.id, projectId: id, role: next })
                    }
                  />
                  <button
                    type="button"
                    className="rounded p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => removeTeam.mutate({ teamId: team.id, projectId: id })}
                    aria-label={t(
                      'manageProjectDetail.managers.removeTeam',
                      { name: team.name },
                      'Remove {name}'
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
