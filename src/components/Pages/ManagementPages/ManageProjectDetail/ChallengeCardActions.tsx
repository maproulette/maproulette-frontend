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
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useMoveChallengeContext } from '@/contexts/MoveChallengeContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Challenge } from '@/types/Challenge'

interface ChallengeCardActionsProps {
  challenge: Challenge
  isPinned: boolean
  onTogglePin: (challengeId: number) => void
  onToggleEnabled: (challenge: Challenge) => void
  onTogglePaused: (challengeId: number, paused: boolean) => void
  onClone: (challenge: { id: number; name: string }) => void
  onArchive: (challengeId: number, isArchived: boolean) => void
  onRebuild: (challengeId: number) => void
  onDelete: (challengeId: number) => void
}

/** Overflow menu + quick-action buttons rendered on a challenge card in the grid view. */
export const ChallengeCardActions = ({
  challenge,
  isPinned,
  onTogglePin,
  onToggleEnabled,
  onTogglePaused,
  onClone,
  onArchive,
  onRebuild,
  onDelete,
}: ChallengeCardActionsProps) => {
  const { t } = useIntl()
  const { openMoveModal } = useMoveChallengeContext()
  const canStart = (challenge.completionMetrics?.tasksRemaining ?? 0) > 0

  return (
    <div className="flex items-center gap-1">
      {challenge.id != null && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault()
            onTogglePaused(challenge.id, challenge.paused ?? false)
          }}
          title={
            challenge.paused
              ? t({ id: 'common.resumeChallenge', defaultMessage: 'Resume challenge' })
              : t({ id: 'common.pauseChallenge', defaultMessage: 'Pause challenge' })
          }
          aria-label={
            challenge.paused
              ? t({ id: 'common.resumeChallenge', defaultMessage: 'Resume challenge' })
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
          onClick={(e) => {
            e.preventDefault()
            onArchive(challenge.id, challenge.isArchived ?? false)
          }}
          title={
            challenge.isArchived
              ? t({ id: 'common.unarchiveChallenge', defaultMessage: 'Unarchive challenge' })
              : t({ id: 'common.archiveChallenge', defaultMessage: 'Archive challenge' })
          }
          aria-label={
            challenge.isArchived
              ? t({ id: 'common.unarchiveChallenge', defaultMessage: 'Unarchive challenge' })
              : t({ id: 'common.archiveChallenge', defaultMessage: 'Archive challenge' })
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
          onClick={(e) => {
            e.preventDefault()
            onTogglePin(challenge.id)
          }}
          title={
            isPinned
              ? t({ id: 'common.unpinChallenge', defaultMessage: 'Unpin challenge' })
              : t({ id: 'common.pinChallenge', defaultMessage: 'Pin challenge' })
          }
          aria-label={
            isPinned
              ? t({ id: 'common.unpinChallenge', defaultMessage: 'Unpin challenge' })
              : t({ id: 'common.pinChallenge', defaultMessage: 'Pin challenge' })
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
      {challenge.id != null && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault()
            onToggleEnabled(challenge)
          }}
          title={
            challenge.enabled
              ? t({ id: 'common.makeNotDiscoverable', defaultMessage: 'Make not discoverable' })
              : t({ id: 'common.makeDiscoverable', defaultMessage: 'Make discoverable' })
          }
          aria-label={
            challenge.enabled
              ? t({ id: 'common.makeNotDiscoverable', defaultMessage: 'Make not discoverable' })
              : t({ id: 'common.makeDiscoverable', defaultMessage: 'Make discoverable' })
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
                {t({ id: 'common.startChallenge', defaultMessage: 'Start challenge' })}
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
              challenge.id != null && openMoveModal({ id: challenge.id, name: challenge.name })
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
                ? t({ id: 'common.unarchiveChallenge', defaultMessage: 'Unarchive challenge' })
                : t({ id: 'common.archiveChallenge', defaultMessage: 'Archive challenge' })}
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
                ? t({ id: 'common.disableChallenge', defaultMessage: 'Disable challenge' })
                : t({ id: 'common.enableChallenge', defaultMessage: 'Enable challenge' })}
            </DropdownMenuItem>
          )}
          {challenge.id != null && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(challenge.id)}
                className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                {t({ id: 'common.deleteChallenge', defaultMessage: 'Delete challenge' })}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
