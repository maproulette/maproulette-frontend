import { Link } from '@tanstack/react-router'
import { ExternalLink, Plus, Users } from 'lucide-react'
import { api } from '@/api'
import { DocsLink } from '@/components/shared/DocsLink'
import { useIntl } from '@/i18n'
import { isPendingInvite } from '@/types/Team'
import { PendingInvitesSection } from '../TeamsPage/PendingInvitesSection'
import { TeamCard } from '../TeamsPage/TeamCard'
import { DashboardEmpty, DashboardSection } from './DashboardSection'

interface TeamsSectionProps {
  userId: number
}

export const TeamsSection = ({ userId }: TeamsSectionProps) => {
  const { t } = useIntl()
  const { data: teamMemberships, isLoading, error } = api.user.teamMemberships(userId)
  const pending = teamMemberships?.filter(isPendingInvite) ?? []
  const active = teamMemberships?.filter((m) => !isPendingInvite(m)) ?? []

  return (
    <DashboardSection
      icon={<Users />}
      title={t({ id: 'common.teams', defaultMessage: 'Teams' })}
      count={teamMemberships?.length}
      isLoading={isLoading}
      error={error}
      actions={
        <>
          <DocsLink
            page="teams"
            icon={<ExternalLink className="size-4" />}
            label={t({ id: 'dashboard.teams.learnMore', defaultMessage: 'Learn more about teams' })}
            className="rounded p-1.5 text-fg-muted no-underline transition-colors hover:bg-muted hover:text-fg"
          />
          <Link
            to="/teams/new"
            className="rounded p-1.5 text-fg-muted transition-colors hover:bg-muted hover:text-fg"
            title={t({ id: 'common.createTeam', defaultMessage: 'Create team' })}
          >
            <Plus className="size-4" />
          </Link>
        </>
      }
    >
      {pending.length === 0 && active.length === 0 ? (
        <DashboardEmpty
          icon={<Users />}
          title={t({ id: 'dashboard.teams.empty.title', defaultMessage: 'No teams' })}
          description={t({
            id: 'dashboard.teams.empty.description',
            defaultMessage: 'Join a team to collaborate',
          })}
        />
      ) : (
        <div className="space-y-3">
          {pending.length > 0 && <PendingInvitesSection invites={pending} />}
          {active.map((membership) => (
            <TeamCard key={membership.id} membership={membership} />
          ))}
        </div>
      )}
    </DashboardSection>
  )
}
