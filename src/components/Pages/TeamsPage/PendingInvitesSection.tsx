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
      toast.success(
        t({ id: 'teams.pendingInvites.acceptSuccess', defaultMessage: 'Invitation accepted' })
      )
    } catch (error) {
      logger.error('Accept invite failed', { error })
      toast.error(
        t({ id: 'teams.pendingInvites.acceptError', defaultMessage: 'Could not accept invitation' })
      )
    }
  }

  const handleDecline = async (teamId: number) => {
    try {
      await decline.mutateAsync(teamId)
      toast.success(
        t({ id: 'teams.pendingInvites.declineSuccess', defaultMessage: 'Invitation declined' })
      )
    } catch (error) {
      logger.error('Decline invite failed', { error })
      toast.error(
        t({
          id: 'teams.pendingInvites.declineError',
          defaultMessage: 'Could not decline invitation',
        })
      )
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-fg text-sm">
        {t(
          {
            id: 'teams.pendingInvites.count',
            defaultMessage:
              '{count, plural, one {You have # pending invitation} other {You have # pending invitations}}',
          },
          { count: invites.length }
        )}
      </h2>
      <ul className="space-y-2">
        {invites.map((invite) => (
          <li key={invite.id}>
            <Card className="flex items-center justify-between gap-3 rounded-xl p-4 transition-colors hover:border-gradient-strong">
              <div className="font-medium">
                {invite.teamName ||
                  t(
                    { id: 'common.team', defaultMessage: 'Team #{teamId}' },
                    { teamId: invite.teamId }
                  )}
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
                  {t({ id: 'teams.pendingInvites.declineButton', defaultMessage: 'Decline' })}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAccept(invite.teamId)}
                  disabled={accept.isPending}
                >
                  <Check className="size-4" aria-hidden="true" />{' '}
                  {t({ id: 'teams.pendingInvites.acceptButton', defaultMessage: 'Accept' })}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
