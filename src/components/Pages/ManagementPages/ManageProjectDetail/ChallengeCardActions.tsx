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
              ? t('common.resumeChallenge', undefined, 'Resume challenge')
              : t('common.pauseChallenge', undefined, 'Pause challenge')
          }
          aria-label={
            challenge.paused
              ? t('common.resumeChallenge', undefined, 'Resume challenge')
              : t('common.pauseChallenge', undefined, 'Pause challenge')
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
              ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
              : t('common.archiveChallenge', undefined, 'Archive challenge')
          }
          aria-label={
            challenge.isArchived
              ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
              : t('common.archiveChallenge', undefined, 'Archive challenge')
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
              ? t('common.unpinChallenge', undefined, 'Unpin challenge')
              : t('common.pinChallenge', undefined, 'Pin challenge')
          }
          aria-label={
            isPinned
              ? t('common.unpinChallenge', undefined, 'Unpin challenge')
              : t('common.pinChallenge', undefined, 'Pin challenge')
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
              ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
              : t('common.makeDiscoverable', undefined, 'Make discoverable')
          }
          aria-label={
            challenge.enabled
              ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
              : t('common.makeDiscoverable', undefined, 'Make discoverable')
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
            <span className="sr-only">{t('common.openMenu', undefined, 'Open menu')}</span>
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
                {t('common.startChallenge', undefined, 'Start challenge')}
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
              {t('common.editChallenge', undefined, 'Edit challenge')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              challenge.id != null && openMoveModal({ id: challenge.id, name: challenge.name })
            }
            className="flex cursor-pointer items-center gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            {t('common.moveChallenge', undefined, 'Move challenge')}
          </DropdownMenuItem>
          {challenge.id != null && (
            <DropdownMenuItem
              onClick={() => onClone({ id: challenge.id, name: challenge.name })}
              className="flex cursor-pointer items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {t('common.cloneChallenge2', undefined, 'Clone challenge')}
            </DropdownMenuItem>
          )}
          {challenge.id != null && (
            <DropdownMenuItem
              onClick={() => onArchive(challenge.id, challenge.isArchived ?? false)}
              className="flex cursor-pointer items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              {challenge.isArchived
                ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
                : t('common.archiveChallenge', undefined, 'Archive challenge')}
            </DropdownMenuItem>
          )}
          {challenge.id != null && (
            <DropdownMenuItem
              onClick={() => onRebuild(challenge.id)}
              className="flex cursor-pointer items-center gap-2"
            >
              <Hammer className="h-4 w-4" />
              {t('common.rebuildTasks', undefined, 'Rebuild tasks')}
            </DropdownMenuItem>
          )}
          {challenge.id != null && (
            <DropdownMenuItem
              onClick={() => onToggleEnabled(challenge)}
              className="flex cursor-pointer items-center gap-2"
            >
              {challenge.enabled
                ? t('common.disableChallenge', undefined, 'Disable challenge')
                : t('common.enableChallenge', undefined, 'Enable challenge')}
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
                {t('common.deleteChallenge', undefined, 'Delete challenge')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
