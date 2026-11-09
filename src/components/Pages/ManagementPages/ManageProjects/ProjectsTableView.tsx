import { Link } from '@tanstack/react-router'
import { Pin } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
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
import { ProjectActionsMenu } from './ProjectActionsMenu'
import type { ChallengeCounts } from './useProjectChallengeCounts'

interface ProjectsTableViewProps {
  projects: Project[]
  challengeCountsByProjectId?: Record<number, ChallengeCounts>
  pinnedProjectIds?: number[]
  onTogglePin?: (projectId: number) => void
  onSelectProject?: (project: Project) => void
  selectedProjectId?: number
}

export const ProjectsTableView = ({
  projects,
  challengeCountsByProjectId = {},
  pinnedProjectIds = [],
  onTogglePin,
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
            <TableHead className="w-[80px]">
              {t({ id: 'common.status', defaultMessage: 'Status' })}
            </TableHead>
            <TableHead className="w-12">
              <span
                title={t({ id: 'common.pinned', defaultMessage: 'Pinned' })}
                className="flex justify-center"
              >
                <Pin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </span>
            </TableHead>
            <TableHead>{t({ id: 'common.name', defaultMessage: 'Name' })}</TableHead>
            <TableHead className="hidden w-20 md:table-cell">
              {t({ id: 'common.id', defaultMessage: 'ID' })}
            </TableHead>
            <TableHead className="hidden w-24 text-center md:table-cell">
              {t({ id: 'common.challenges', defaultMessage: 'Challenges' })}
            </TableHead>
            <TableHead className="hidden max-w-[240px] lg:table-cell">
              {t({ id: 'common.description', defaultMessage: 'Description' })}
            </TableHead>
            {showActions && (
              <TableHead className="w-[60px] text-right">
                {t({ id: 'common.actions', defaultMessage: 'Actions' })}
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
                          ? t({ id: 'common.unpinProject', defaultMessage: 'Unpin project' })
                          : t({ id: 'common.pinProject', defaultMessage: 'Pin project' })
                      }
                      aria-label={
                        pinned
                          ? t({ id: 'common.unpinProject', defaultMessage: 'Unpin project' })
                          : t({ id: 'common.pinProject', defaultMessage: 'Pin project' })
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
                      title={t({ id: 'common.pinned', defaultMessage: 'Pinned' })}
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
                  {project.id != null
                    ? (challengeCountsByProjectId[project.id]?.total ?? '—')
                    : '—'}
                </TableCell>
                <TableCell className="hidden max-w-[240px] truncate text-zinc-600 lg:table-cell dark:text-zinc-400">
                  {project.description || '—'}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <ProjectActionsMenu project={project} />
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
