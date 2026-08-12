import { Link } from '@tanstack/react-router'
import { BookmarkX, MoreHorizontal, Play, Settings } from 'lucide-react'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useIntl } from '@/i18n'
import { canManageChallenge } from '@/lib/challengePermissions'
import type { Challenge } from '@/types/Challenge'

interface SavedChallengeActionsProps {
  challenge: Challenge
  userId: number
}

/** Overflow menu on a saved-challenge card: browse, manage (managers only), and unsave. */
export const SavedChallengeActions = ({ challenge, userId }: SavedChallengeActionsProps) => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const unsaveChallenge = api.user.useUnsaveChallenge()
  const canManage = canManageChallenge(user, challenge)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-white/80 backdrop-blur dark:bg-slate-800/80"
          onClick={(e) => {
            // The card is wrapped in a Link; keep opening the menu from navigating.
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('common.openMenu', undefined, 'Open menu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            to="/challenge/$challengeId"
            params={{ challengeId: String(challenge.id) }}
            className="flex cursor-pointer items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {t('dashboard.savedChallenges.actions.browse', undefined, 'Browse challenge')}
          </Link>
        </DropdownMenuItem>
        {canManage && (
          <DropdownMenuItem asChild>
            <Link
              to="/manage/challenge/$challengeId"
              params={{ challengeId: String(challenge.id) }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('dashboard.savedChallenges.actions.manage', undefined, 'Manage challenge')}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={unsaveChallenge.isPending}
          onClick={(e) => {
            e.preventDefault()
            unsaveChallenge.mutate({ userId, challengeId: challenge.id })
          }}
          className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <BookmarkX className="h-4 w-4" />
          {t('dashboard.savedChallenges.actions.unsave', undefined, 'Unsave challenge')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
