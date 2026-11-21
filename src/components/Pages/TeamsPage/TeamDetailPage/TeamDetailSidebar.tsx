import { Link } from '@tanstack/react-router'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { resolveTeamImageUrl } from '@/api/urls'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { Separator } from '@/components/ui/Separator'
import { useIntl } from '@/i18n'
import { initials } from '@/lib/utils'
import { TeamImagesSection } from '../TeamImagesSection'
import { useTeamDetailContext } from './TeamDetailContext'

/**
 * Left-hand panel of the team detail page: who the team is, what a manager can
 * do to it, and the image it puts on its challenges. Everything here is about
 * the team itself -- what the team *has*, members included, lives in the panel
 * alongside it.
 */
export const TeamDetailSidebar = () => {
  const { t } = useIntl()
  const {
    teamId,
    team,
    members,
    iAmAdmin,
    iAmOwner,
    currentUserId,
    setInviteOpen,
    setConfirmDelete,
  } = useTeamDetailContext()

  if (!team) return null

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-lg border-gradient bg-panel">
      <div className="space-y-4 px-6 pt-6 pb-4">
        <div className="flex gap-4">
          <Avatar className="size-16 shrink-0">
            <AvatarImage src={resolveTeamImageUrl(team.avatarURL) ?? ''} alt={team.name} />
            <AvatarFallback>{initials(team.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="break-words font-bold text-base text-fg leading-tight tracking-tight">
              {team.name}
            </h1>
            {team.description && <p className="mt-1 text-fg-muted text-sm">{team.description}</p>}
            <p className="mt-1 text-fg-subtle text-xs">
              {t(
                {
                  id: 'teams.detail.memberCount',
                  defaultMessage: '{count, plural, one {# member} other {# members}}',
                },
                { count: members.length }
              )}
            </p>
          </div>
        </div>

        {iAmAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/teams/$teamId/edit" params={{ teamId: String(teamId) }}>
                <Pencil className="size-4" aria-hidden="true" />{' '}
                {t({ id: 'common.edit', defaultMessage: 'Edit' })}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" aria-hidden="true" />{' '}
              {t({ id: 'teams.detail.inviteButton', defaultMessage: 'Invite' })}
            </Button>
            <DisabledTooltip
              show={!iAmOwner}
              message={t({
                id: 'teams.detail.deleteDisabledReason',
                defaultMessage: 'Only an owner of the team can delete it',
              })}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={!iAmOwner}
              >
                <Trash2 className="size-4" aria-hidden="true" />{' '}
                {t({ id: 'common.delete', defaultMessage: 'Delete' })}
              </Button>
            </DisabledTooltip>
          </div>
        )}
      </div>

      <Separator />

      <div className="px-6 py-4">
        <TeamImagesSection teamId={teamId} isAdmin={iAmAdmin} currentUserId={currentUserId} />
      </div>
    </div>
  )
}
