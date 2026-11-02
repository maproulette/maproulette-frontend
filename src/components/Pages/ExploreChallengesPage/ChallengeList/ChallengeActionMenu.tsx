import { Link } from '@tanstack/react-router'
import { Copy, Eye, MoreHorizontal, Play } from 'lucide-react'
import { memo } from 'react'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useIntl } from '@/i18n'
import type { Challenge } from '@/types/Challenge'

export const ChallengeActionMenu = memo(({ challenge }: { challenge: Challenge }) => {
  const { t } = useIntl()
  const { copy } = useCopyToClipboard()
  const canStart = (challenge.completionMetrics?.tasksRemaining ?? 0) > 0

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t({ id: 'common.openMenu', defaultMessage: 'Open menu' })}</span>
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
              to="/challenge/$challengeId"
              params={{ challengeId: String(challenge.id) }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {t({ id: 'common.viewChallenge', defaultMessage: 'View challenge' })}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void copy(`${window.location.origin}/challenge/${challenge.id}`)}
            className="flex cursor-pointer items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {t({ id: 'common.copyUrl', defaultMessage: 'Copy URL' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})
