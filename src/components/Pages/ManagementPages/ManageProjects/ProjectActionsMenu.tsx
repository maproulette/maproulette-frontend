import { Link } from '@tanstack/react-router'
import { Archive, Copy, Eye, FileDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useIntl } from '@/i18n'
import type { Project } from '@/types/Project'
import { useManageProjectsContext } from './ManageProjectsContext'

interface ProjectActionsMenuProps {
  project: Project
}

export const ProjectActionsMenu = ({ project }: ProjectActionsMenuProps) => {
  const { t } = useIntl()
  const { handleExportCsv, handleArchiveProject, handleDeleteProject } = useManageProjectsContext()

  const projectId = project.id

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('common.openMenu', undefined, 'Open menu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            to="/manage/project/$projectId"
            params={{ projectId: String(projectId) }}
            className="flex cursor-pointer items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {t('common.viewProject', undefined, 'View project')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/manage/project/$projectId/edit"
            params={{ projectId: String(projectId) }}
            className="flex cursor-pointer items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            {t('common.editProject', undefined, 'Edit project')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/manage/challenge/new"
            search={{ projectId: Number(projectId) }}
            className="flex cursor-pointer items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('common.addChallenge', undefined, 'Add challenge')}
          </Link>
        </DropdownMenuItem>
        {projectId != null && (
          <DropdownMenuItem
            onClick={() => handleExportCsv(projectId)}
            className="flex cursor-pointer items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            {t('common.exportCsv', undefined, 'Export CSV')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            const url = `${window.location.origin}/manage/project/${projectId}`
            void navigator.clipboard.writeText(url)
          }}
          className="flex cursor-pointer items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          {t('common.copyUrl', undefined, 'Copy URL')}
        </DropdownMenuItem>
        {projectId != null && (
          <DropdownMenuItem
            onClick={() => handleArchiveProject(projectId, project.isArchived ?? false)}
            className="flex cursor-pointer items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            {project.isArchived
              ? t('common.unarchiveProject', undefined, 'Unarchive project')
              : t('common.archiveProject', undefined, 'Archive project')}
          </DropdownMenuItem>
        )}
        {projectId != null && (
          <DropdownMenuItem
            onClick={() => handleDeleteProject(projectId, project.displayName || project.name)}
            className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {t('common.deleteProject', undefined, 'Delete project')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
