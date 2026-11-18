import { Link } from '@tanstack/react-router'
import {
  Archive,
  ArrowRightLeft,
  Copy,
  Hammer,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react'
import {
  ArchiveButton,
  DiscoverableButton,
  PauseButton,
  PinButton,
} from '@/components/Pages/ManagementPages/shared/QuickActionButtons'
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
import type { Challenge } from '@/types/Challenge'
import { ChallengeSelectCheckbox } from './ChallengeSelection'

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
        <span className="flex h-8 w-8 items-center justify-center">
          <ChallengeSelectCheckbox challengeId={challenge.id} challengeName={challenge.name} />
        </span>
      )}
      {challenge.id != null && (
        <PauseButton
          paused={challenge.paused ?? false}
          onClick={() => onTogglePaused(challenge.id, challenge.paused ?? false)}
        />
      )}
      {challenge.id != null && (
        <ArchiveButton
          archived={challenge.isArchived ?? false}
          onClick={() => onArchive(challenge.id, challenge.isArchived ?? false)}
        />
      )}
      {challenge.id != null && (
        <PinButton pinned={isPinned} entity="challenge" onClick={() => onTogglePin(challenge.id)} />
      )}
      {challenge.id != null && (
        <DiscoverableButton
          enabled={challenge.enabled ?? false}
          onClick={() => onToggleEnabled(challenge)}
        />
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
