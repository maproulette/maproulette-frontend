import {
  DiscoverableButton,
  PinButton,
} from '@/components/Pages/ManagementPages/shared/QuickActionButtons'
import type { Project } from '@/types/Project'
import { useManageProjectsContext } from './ManageProjectsContext'
import { ProjectActionsMenu } from './ProjectActionsMenu'

interface ProjectActionsProps {
  project: Project
  isPinned: boolean
}

export const ProjectActions = ({ project, isPinned }: ProjectActionsProps) => {
  const { toggleProjectPin, updateProject } = useManageProjectsContext()
  const projectId = project.id
  return (
    <div className="flex items-center gap-1">
      {projectId != null && (
        <PinButton pinned={isPinned} entity="project" onClick={() => toggleProjectPin(projectId)} />
      )}
      {projectId != null && (
        <DiscoverableButton
          enabled={project.enabled ?? false}
          onClick={() => updateProject(projectId, { enabled: !(project.enabled ?? false) })}
        />
      )}
      <ProjectActionsMenu project={project} />
    </div>
  )
}
