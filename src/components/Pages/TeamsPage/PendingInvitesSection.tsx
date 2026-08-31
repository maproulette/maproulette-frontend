import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import type { TeamUser } from '@/types/Team'

interface Props {
  invites: TeamUser[]
}

export const PendingInvitesSection = ({ invites }: Props) => {
  const { t } = useIntl()
  const accept = api.team.useAcceptInvite()
  const decline = api.team.useDeclineInvite()

  const handleAccept = async (teamId: number) => {
    try {
      await accept.mutateAsync(teamId)
      toast.success(t('teams.pendingInvites.acceptSuccess', undefined, 'Invitation accepted'))
    } catch (error) {
      logger.error('Accept invite failed', { error })
      toast.error(t('teams.pendingInvites.acceptError', undefined, 'Could not accept invitation'))
    }
  }

  const handleDecline = async (teamId: number) => {
    try {
      await decline.mutateAsync(teamId)
      toast.success(t('teams.pendingInvites.declineSuccess', undefined, 'Invitation declined'))
    } catch (error) {
      logger.error('Decline invite failed', { error })
      toast.error(t('teams.pendingInvites.declineError', undefined, 'Could not decline invitation'))
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-sm text-zinc-700 dark:text-slate-300">
        {t(
          'teams.pendingInvites.count',
          { count: invites.length },
          'You have {count, plural, one {# pending invitation} other {# pending invitations}}'
        )}
      </h2>
      <ul className="space-y-2">
        {invites.map((invite) => (
          <li key={invite.id}>
            <Card className="flex items-center justify-between gap-3 p-3">
              <div className="font-medium">
                {invite.teamName || t('common.team', { teamId: invite.teamId }, 'Team #{teamId}')}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecline(invite.teamId)}
                  disabled={decline.isPending}
                >
                  <X className="size-4" aria-hidden="true" />{' '}
                  {t('teams.pendingInvites.declineButton', undefined, 'Decline')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAccept(invite.teamId)}
                  disabled={accept.isPending}
                >
                  <Check className="size-4" aria-hidden="true" />{' '}
                  {t('teams.pendingInvites.acceptButton', undefined, 'Accept')}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
