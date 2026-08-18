import { Link } from '@tanstack/react-router'
import { ExternalLink, Plus, Users } from 'lucide-react'
import { api } from '@/api'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { isPendingInvite } from '@/types/Team'
import { PendingInvitesSection } from '../TeamsPage/PendingInvitesSection'
import { TeamCard } from '../TeamsPage/TeamCard'

interface TeamsSectionProps {
  userId: number
}

export const TeamsSection = ({ userId }: TeamsSectionProps) => {
  const { t } = useIntl()
  const { data: teamMemberships, isLoading, error } = api.user.teamMemberships(userId)
  const pending = teamMemberships?.filter(isPendingInvite) ?? []
  const active = teamMemberships?.filter((m) => !isPendingInvite(m)) ?? []

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800">
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        <Users className="h-4 w-4 text-purple-400" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t('common.teams', undefined, 'Teams')}
        </h3>
        <a
          href="https://learn.maproulette.org/en-US/documentation/teams/"
          target="_blank"
          rel="noreferrer"
          className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-slate-500 dark:hover:text-slate-300"
          title={t('dashboard.teams.learnMore', undefined, 'Learn more about teams')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <div className="ml-auto flex items-center gap-2">
          {teamMemberships && teamMemberships.length > 0 && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 font-medium text-purple-400 text-xs">
              {teamMemberships.length}
            </span>
          )}
          <Link
            to="/teams/new"
            className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-purple-200 hover:text-zinc-700 dark:text-slate-400 dark:hover:bg-purple-500/30 dark:hover:text-slate-100"
            title={t('common.createTeam', undefined, 'Create team')}
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader />
          </div>
        )}

        {error && (
          <div className="py-2 text-center text-red-400 text-sm">
            {t('dashboard.common.failedToLoad', undefined, 'Failed to load')}
          </div>
        )}

        {!isLoading && !error && pending.length === 0 && active.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 rounded-lg bg-zinc-100 p-2 dark:bg-slate-700/50">
              <Users className="h-5 w-5 text-zinc-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-slate-400">
              {t('dashboard.teams.empty.title', undefined, 'No teams')}
            </p>
            <p className="text-xs text-zinc-500 dark:text-slate-500">
              {t('dashboard.teams.empty.description', undefined, 'Join a team to collaborate')}
            </p>
          </div>
        )}

        {!isLoading && !error && (pending.length > 0 || active.length > 0) && (
          <div className="space-y-3">
            {pending.length > 0 && <PendingInvitesSection invites={pending} />}
            {active.length > 0 && (
              <div className="space-y-2">
                {active.map((membership) => (
                  <TeamCard key={membership.id} membership={membership} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
