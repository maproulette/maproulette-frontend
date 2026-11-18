import { api } from '@/api'
import { ManagersPanel } from '@/components/Pages/ManagementPages/shared/ManagersPanel'
import { DocsLink } from '@/components/shared/DocsLink'
import { useIntl } from '@/i18n'
import { PROJECT_ROLE, strongestRole, TEAM_ATTACHMENT_ROLE } from '@/lib/projectRoles'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'

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

  return (
    <ManagersPanel
      title={t({ id: 'manageProjectDetail.managers.title', defaultMessage: 'Project managers' })}
      titleAction={
        <DocsLink
          page="projectsAndProjectManagers"
          label={t({
            id: 'manageProjectDetail.managers.docsLink',
            defaultMessage: 'About project roles',
          })}
          className="ml-auto text-fg-subtle no-underline hover:text-fg-muted"
        />
      }
      managers={managers?.map((manager) => ({
        userId: manager.userId,
        name: manager.displayName,
        avatarURL: manager.avatarURL,
        role: strongestRole(manager.roles) ?? PROJECT_ROLE.read,
      }))}
      isLoading={isLoading}
      teams={teamManagers?.map(({ team }) => team)}
      isSettingRole={setUserRole.isPending}
      addedMessage={(name) =>
        t(
          {
            id: 'manageProjectDetail.managers.added',
            defaultMessage: '{name} can now manage this project',
          },
          { name }
        )
      }
      setUserRole={(userId, role) => setUserRole.mutateAsync({ userId, projectId: id, role })}
      removeUser={({ userId, role }) => removeUser.mutate({ userId, projectId: id, role })}
      addTeam={(teamId) =>
        setTeamRole.mutateAsync({ teamId, projectId: id, role: TEAM_ATTACHMENT_ROLE })
      }
      removeTeam={(teamId) => removeTeam.mutate({ teamId, projectId: id })}
    />
  )
}
