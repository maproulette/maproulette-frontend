import { Link } from '@tanstack/react-router'
import {
  Archive,
  ArrowRightLeft,
  Copy,
  Eye,
  EyeOff,
  Hammer,
  MoreHorizontal,
  Pause,
  Pencil,
  Pin,
  Play,
  Trash2,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useMoveChallengeContext } from '@/contexts/MoveChallengeContext'
import { useIntl } from '@/i18n'
import { getDifficultyLabel } from '@/lib/difficultyLevelData'
import { cn } from '@/lib/utils'
import type { Challenge } from '@/types/Challenge'
import { ChallengeSelectCheckbox, SelectAllChallengesCheckbox } from './ChallengeSelection'

interface ChallengesTableViewProps {
  challenges: Challenge[]
  pinnedChallengeIds: number[]
  onTogglePin: (challengeId: number) => void
  onToggleEnabled: (challenge: Challenge) => void
  onTogglePaused: (challengeId: number, paused: boolean) => void
  onClone: (challenge: { id: number; name: string }) => void
  onArchive: (challengeId: number, isArchived: boolean) => void
  onRebuild: (challengeId: number) => void
  onDelete: (challengeId: number) => void
}

export const ChallengesTableView = ({
  challenges,
  pinnedChallengeIds,
  onTogglePin,
  onToggleEnabled,
  onTogglePaused,
  onClone,
  onArchive,
  onRebuild,
  onDelete,
}: ChallengesTableViewProps) => {
  const { t } = useIntl()
  const { openMoveModal } = useMoveChallengeContext()
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <SelectAllChallengesCheckbox />
            </TableHead>
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
            <TableHead className="hidden w-28 text-center md:table-cell">
              {t({ id: 'common.difficulty', defaultMessage: 'Difficulty' })}
            </TableHead>
            <TableHead className="hidden w-32 text-center md:table-cell">
              {t({
                id: 'manageProjectDetail.challengesTable.columnTasksLeft',
                defaultMessage: 'Tasks Left',
              })}
            </TableHead>
            <TableHead className="hidden max-w-[200px] lg:table-cell">
              {t({ id: 'common.description', defaultMessage: 'Description' })}
            </TableHead>
            <TableHead className="w-[100px] text-right">
              {t({ id: 'common.actions', defaultMessage: 'Actions' })}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {challenges.map((challenge) => {
            const pinned = challenge.id != null && pinnedChallengeIds.includes(challenge.id)
            const canStart = (challenge.completionMetrics?.tasksRemaining ?? 0) > 0
            return (
              <TableRow key={challenge.id}>
                <TableCell>
                  {challenge.id != null && (
                    <ChallengeSelectCheckbox
                      challengeId={challenge.id}
                      challengeName={challenge.name}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge enabled={challenge.enabled ?? false} />
                </TableCell>
                <TableCell className="text-center">
                  {challenge.id != null ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mx-auto h-8 w-8"
                      onClick={() => onTogglePin(challenge.id)}
                      title={
                        pinned
                          ? t({ id: 'common.unpinChallenge', defaultMessage: 'Unpin challenge' })
                          : t({ id: 'common.pinChallenge', defaultMessage: 'Pin challenge' })
                      }
                      aria-label={
                        pinned
                          ? t({ id: 'common.unpinChallenge', defaultMessage: 'Unpin challenge' })
                          : t({ id: 'common.pinChallenge', defaultMessage: 'Pin challenge' })
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
                  ) : (
                    <span className="text-zinc-300 dark:text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    to="/manage/challenge/$challengeId"
                    params={{ challengeId: String(challenge.id) }}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {challenge.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-zinc-500 md:table-cell dark:text-zinc-400">
                  {challenge.id}
                </TableCell>
                <TableCell className="hidden text-center text-zinc-500 md:table-cell dark:text-zinc-400">
                  {getDifficultyLabel(t, challenge.difficulty)}
                </TableCell>
                <TableCell className="hidden text-center md:table-cell">
                  <span className="font-medium tabular-nums">
                    {challenge.completionMetrics?.tasksRemaining ?? 0}
                  </span>
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate text-zinc-600 lg:table-cell dark:text-zinc-400">
                  {challenge.blurb || challenge.description || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {challenge.id != null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onTogglePaused(challenge.id, challenge.paused ?? false)}
                        title={
                          challenge.paused
                            ? t({
                                id: 'common.resumeChallenge',
                                defaultMessage: 'Resume challenge',
                              })
                            : t({ id: 'common.pauseChallenge', defaultMessage: 'Pause challenge' })
                        }
                        aria-label={
                          challenge.paused
                            ? t({
                                id: 'common.resumeChallenge',
                                defaultMessage: 'Resume challenge',
                              })
                            : t({ id: 'common.pauseChallenge', defaultMessage: 'Pause challenge' })
                        }
                      >
                        <Pause
                          className={cn(
                            'h-4 w-4',
                            challenge.paused
                              ? 'text-amber-500 dark:text-amber-400'
                              : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
                          )}
                        />
                      </Button>
                    )}
                    {challenge.id != null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onArchive(challenge.id, challenge.isArchived ?? false)}
                        title={
                          challenge.isArchived
                            ? t({
                                id: 'common.unarchiveChallenge',
                                defaultMessage: 'Unarchive challenge',
                              })
                            : t({
                                id: 'common.archiveChallenge',
                                defaultMessage: 'Archive challenge',
                              })
                        }
                        aria-label={
                          challenge.isArchived
                            ? t({
                                id: 'common.unarchiveChallenge',
                                defaultMessage: 'Unarchive challenge',
                              })
                            : t({
                                id: 'common.archiveChallenge',
                                defaultMessage: 'Archive challenge',
                              })
                        }
                      >
                        <Archive
                          className={cn(
                            'h-4 w-4',
                            challenge.isArchived
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
                          )}
                        />
                      </Button>
                    )}
                    {challenge.id != null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onToggleEnabled(challenge)}
                        title={
                          challenge.enabled
                            ? t({
                                id: 'common.makeNotDiscoverable',
                                defaultMessage: 'Make not discoverable',
                              })
                            : t({
                                id: 'common.makeDiscoverable',
                                defaultMessage: 'Make discoverable',
                              })
                        }
                        aria-label={
                          challenge.enabled
                            ? t({
                                id: 'common.makeNotDiscoverable',
                                defaultMessage: 'Make not discoverable',
                              })
                            : t({
                                id: 'common.makeDiscoverable',
                                defaultMessage: 'Make discoverable',
                              })
                        }
                      >
                        {challenge.enabled ? (
                          <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400" />
                        )}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">
                            {t({ id: 'common.openMenu', defaultMessage: 'Open menu' })}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canStart && (
                          <DropdownMenuItem asChild>
                            <Link
                              to="/challenge/$challengeId"
                              params={{ challengeId: String(challenge.id) }}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Play className="h-4 w-4" />
                              {t({
                                id: 'common.startChallenge',
                                defaultMessage: 'Start challenge',
                              })}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link
                            to="/manage/challenge/$challengeId/edit"
                            params={{ challengeId: String(challenge.id) }}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            {t({ id: 'common.editChallenge', defaultMessage: 'Edit challenge' })}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            challenge.id != null &&
                            openMoveModal({ id: challenge.id, name: challenge.name })
                          }
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          {t({ id: 'common.moveChallenge', defaultMessage: 'Move challenge' })}
                        </DropdownMenuItem>
                        {challenge.id != null && (
                          <DropdownMenuItem
                            onClick={() => onClone({ id: challenge.id, name: challenge.name })}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            {t({ id: 'common.cloneChallenge2', defaultMessage: 'Clone challenge' })}
                          </DropdownMenuItem>
                        )}
                        {challenge.id != null && (
                          <DropdownMenuItem
                            onClick={() => onArchive(challenge.id, challenge.isArchived ?? false)}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Archive className="h-4 w-4" />
                            {challenge.isArchived
                              ? t({
                                  id: 'common.unarchiveChallenge',
                                  defaultMessage: 'Unarchive challenge',
                                })
                              : t({
                                  id: 'common.archiveChallenge',
                                  defaultMessage: 'Archive challenge',
                                })}
                          </DropdownMenuItem>
                        )}
                        {challenge.id != null && (
                          <DropdownMenuItem
                            onClick={() => onRebuild(challenge.id)}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Hammer className="h-4 w-4" />
                            {t({ id: 'common.rebuildTasks', defaultMessage: 'Rebuild tasks' })}
                          </DropdownMenuItem>
                        )}
                        {challenge.id != null && (
                          <DropdownMenuItem
                            onClick={() => onToggleEnabled(challenge)}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            {challenge.enabled
                              ? t({
                                  id: 'common.disableChallenge',
                                  defaultMessage: 'Disable challenge',
                                })
                              : t({
                                  id: 'common.enableChallenge',
                                  defaultMessage: 'Enable challenge',
                                })}
                          </DropdownMenuItem>
                        )}
                        {challenge.id != null && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(challenge.id)}
                              className={cn(
                                'flex cursor-pointer items-center gap-2',
                                'text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400'
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t({
                                id: 'common.deleteChallenge',
                                defaultMessage: 'Delete challenge',
                              })}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
