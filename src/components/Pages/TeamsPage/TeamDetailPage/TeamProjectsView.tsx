import { FolderOpen } from 'lucide-react'
import { api } from '@/api'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { ProjectCard } from '@/components/shared/ProjectCard'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { useTeamDetailContext } from './TeamDetailContext'

/**
 * The Projects tab: the projects this team has been granted a role on. The
 * backend keeps out any the viewer may not see, so an empty grid here means
 * "nothing to show you", not necessarily "nothing at all".
 */
export const TeamProjectsView = () => {
  const { t } = useIntl()
  const { teamId } = useTeamDetailContext()
  const { data: projects = [], isLoading } = api.team.projects(teamId)

  if (isLoading) return <Loader />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <EntityGrid
        items={projects}
        getItemKey={(project, index) => project.id ?? index}
        renderItem={(project) => <ProjectCard project={project} />}
        emptyState={{
          icon: FolderOpen,
          title: t('teams.detail.noProjectsTitle', undefined, 'No projects'),
          description: t(
            'teams.detail.noProjectsDescription',
            undefined,
            'This team has not been given a role on any project.'
          ),
        }}
      />
    </div>
  )
}
