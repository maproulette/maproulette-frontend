import { Eye, EyeOff, Pin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/Project'
import { useManageProjectsContext } from './ManageProjectsContext'
import { ProjectActionsMenu } from './ProjectActionsMenu'

interface ProjectActionsProps {
  project: Project
  isPinned: boolean
}

export const ProjectActions = ({ project, isPinned }: ProjectActionsProps) => {
  const { t } = useIntl()
  const { toggleProjectPin, updateProject } = useManageProjectsContext()
  const projectId = project.id
  return (
    <div className="flex items-center gap-1">
      {projectId != null && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault()
            toggleProjectPin(projectId)
          }}
          title={
            isPinned
              ? t({ id: 'common.unpinProject', defaultMessage: 'Unpin project' })
              : t({ id: 'common.pinProject', defaultMessage: 'Pin project' })
          }
          aria-label={
            isPinned
              ? t({ id: 'common.unpinProject', defaultMessage: 'Unpin project' })
              : t({ id: 'common.pinProject', defaultMessage: 'Pin project' })
          }
        >
          <Pin
            className={cn(
              'h-4 w-4',
              isPinned
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
            )}
          />
        </Button>
      )}
      {projectId != null && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault()
            updateProject(projectId, { enabled: !(project.enabled ?? false) })
          }}
          title={
            project.enabled
              ? t({ id: 'common.makeNotDiscoverable', defaultMessage: 'Make not discoverable' })
              : t({ id: 'common.makeDiscoverable', defaultMessage: 'Make discoverable' })
          }
          aria-label={
            project.enabled
              ? t({ id: 'common.makeNotDiscoverable', defaultMessage: 'Make not discoverable' })
              : t({ id: 'common.makeDiscoverable', defaultMessage: 'Make discoverable' })
          }
        >
          {project.enabled ? (
            <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <EyeOff className="h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400" />
          )}
        </Button>
      )}
      <ProjectActionsMenu project={project} />
    </div>
  )
}
