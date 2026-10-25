import { Link } from '@tanstack/react-router'
import {
  Archive,
  Copy,
  Eye,
  FileDown,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Trash2,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { useIntl } from '@/i18n'
import type { Project } from '@/types/Project'

interface ProjectsTableViewProps {
  projects: Project[]
  challengeCountsByProjectId?: Record<number, number>
  pinnedProjectIds?: number[]
  onTogglePin?: (projectId: number) => void
  onExportCsv?: (projectId: number) => void
  onArchiveProject?: (projectId: number, isArchived: boolean) => void
  onDeleteProject?: (projectId: number, projectName: string) => void
  onSelectProject?: (project: Project) => void
  selectedProjectId?: number
}

export const ProjectsTableView = ({
  projects,
  challengeCountsByProjectId = {},
  pinnedProjectIds = [],
  onTogglePin,
  onExportCsv,
  onArchiveProject,
  onDeleteProject,
  onSelectProject,
  selectedProjectId,
}: ProjectsTableViewProps) => {
  const { t } = useIntl()
  const showActions = !onSelectProject
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{t('common.status', undefined, 'Status')}</TableHead>
            <TableHead className="w-12">
              <span title={t('common.pinned', undefined, 'Pinned')} className="flex justify-center">
                <Pin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </span>
            </TableHead>
            <TableHead>{t('common.name', undefined, 'Name')}</TableHead>
            <TableHead className="hidden w-20 md:table-cell">
              {t('common.id', undefined, 'ID')}
            </TableHead>
            <TableHead className="hidden w-24 text-center md:table-cell">
              {t('common.challenges', undefined, 'Challenges')}
            </TableHead>
            <TableHead className="hidden max-w-[240px] lg:table-cell">
              {t('common.description', undefined, 'Description')}
            </TableHead>
            {showActions && (
              <TableHead className="w-[60px] text-right">
                {t('common.actions', undefined, 'Actions')}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const pinned = project.id != null && pinnedProjectIds.includes(project.id)
            return (
              <TableRow
                key={project.id}
                data-state={
                  project.id != null && project.id === selectedProjectId ? 'selected' : undefined
                }
              >
                <TableCell>
                  <StatusBadge enabled={project.enabled ?? false} />
                </TableCell>
                <TableCell className="text-center">
                  {onTogglePin && project.id != null ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mx-auto h-8 w-8"
                      onClick={() => onTogglePin(project.id as number)}
                      title={
                        pinned
                          ? t('common.unpinProject', undefined, 'Unpin project')
                          : t('common.pinProject', undefined, 'Pin project')
                      }
                      aria-label={
                        pinned
                          ? t('common.unpinProject', undefined, 'Unpin project')
                          : t('common.pinProject', undefined, 'Pin project')
                      }
                    >
                      <Pin
                        className={
                          pinned
                            ? 'h-4 w-4 text-amber-600 dark:text-amber-400'
                            : 'h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
                        }
                      />
                    </Button>
                  ) : pinned ? (
                    <span
                      title={t('common.pinned', undefined, 'Pinned')}
                      className="flex justify-center"
                    >
                      <Pin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </span>
                  ) : (
                    <span className="text-zinc-300 dark:text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {onSelectProject ? (
                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      aria-pressed={project.id != null && project.id === selectedProjectId}
                      className="text-left font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {project.displayName || project.name}
                    </button>
                  ) : (
                    <Link
                      to="/manage/project/$projectId"
                      params={{ projectId: String(project.id) }}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {project.displayName || project.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="hidden text-zinc-500 md:table-cell dark:text-zinc-400">
                  {project.id}
                </TableCell>
                <TableCell className="hidden text-center md:table-cell">
                  {project.id != null ? (challengeCountsByProjectId[project.id] ?? '—') : '—'}
                </TableCell>
                <TableCell className="hidden max-w-[240px] truncate text-zinc-600 lg:table-cell dark:text-zinc-400">
                  {project.description || '—'}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">
                            {t('common.openMenu', undefined, 'Open menu')}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/manage/project/$projectId"
                            params={{ projectId: String(project.id) }}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            {t('common.viewProject', undefined, 'View project')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/manage/project/$projectId/edit"
                            params={{ projectId: String(project.id) }}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            {t('common.editProject', undefined, 'Edit project')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/manage/challenge/new"
                            search={{ projectId: Number(project.id) }}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            {t('common.addChallenge', undefined, 'Add challenge')}
                          </Link>
                        </DropdownMenuItem>
                        {onExportCsv && project.id != null && (
                          <DropdownMenuItem
                            onClick={() => onExportCsv(project.id as number)}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <FileDown className="h-4 w-4" />
                            {t('common.exportCsv', undefined, 'Export CSV')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            const url = `${window.location.origin}/manage/project/${project.id}`
                            void navigator.clipboard.writeText(url)
                          }}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {t('common.copyUrl', undefined, 'Copy URL')}
                        </DropdownMenuItem>
                        {onArchiveProject && project.id != null && (
                          <DropdownMenuItem
                            onClick={() =>
                              onArchiveProject(project.id as number, project.isArchived ?? false)
                            }
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Archive className="h-4 w-4" />
                            {project.isArchived
                              ? t('common.unarchiveProject', undefined, 'Unarchive project')
                              : t('common.archiveProject', undefined, 'Archive project')}
                          </DropdownMenuItem>
                        )}
                        {onDeleteProject && project.id != null && (
                          <DropdownMenuItem
                            onClick={() =>
                              onDeleteProject(
                                project.id as number,
                                project.displayName || project.name
                              )
                            }
                            className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('common.deleteProject', undefined, 'Delete project')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
