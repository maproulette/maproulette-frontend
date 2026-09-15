import { Link } from '@tanstack/react-router'
import { Link2, MoreHorizontal, Play, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useIntl } from '@/i18n'
import { canManageChallenge } from '@/lib/challengePermissions'
import type { Challenge } from '@/types/Challenge'

/**
 * The overflow menu on a team's challenge card. Deliberately short: this is a
 * place to look at a team's work, not to administer it, so it offers the ways
 * in and nothing destructive.
 */
export const TeamChallengeActions = ({ challenge }: { challenge: Challenge }) => {
  const { t } = useIntl()
  const { user } = useAuthContext()
  const { copy } = useCopyToClipboard()

  const challengeId = String(challenge.id)
  const canManage = canManageChallenge(user, challenge)
  const canStart = (challenge.completionMetrics?.tasksRemaining ?? 0) > 0

  const handleCopyLink = async () => {
    await copy(`${window.location.origin}/challenge/${challengeId}`)
    toast.success(t('common.linkCopiedToClipboard', undefined, 'Link copied to clipboard'))
  }

  return (
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
              params={{ challengeId }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {t('common.startChallenge', undefined, 'Start challenge')}
            </Link>
          </DropdownMenuItem>
        )}
        {canManage && (
          <DropdownMenuItem asChild>
            <Link
              to="/manage/challenge/$challengeId"
              params={{ challengeId }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('teams.detail.manageChallenge', undefined, 'Manage challenge')}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex cursor-pointer items-center gap-2"
        >
          <Link2 className="h-4 w-4" />
          {t('common.copyLink', undefined, 'Copy link')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
