import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { api } from '@/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { useIntl } from '@/i18n'
import { resolveTeamImageUrl } from '@/lib/teamImage'
import { initials } from '@/lib/utils'
import type { TeamUser } from '@/types/Team'
import { TeamDisplayRoleLabel, teamDisplayRole } from '@/types/Team'

interface Props {
  membership: TeamUser
}

export const TeamCard = ({ membership }: Props) => {
  const { t } = useIntl()
  const { data: team } = api.team.get(membership.teamId)
  const name =
    membership.teamName ||
    t({ id: 'common.team', defaultMessage: 'Team #{teamId}' }, { teamId: membership.teamId })
  const role = teamDisplayRole(membership)
  return (
    <div className="group stretched-link-container block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:hover:brightness-110">
      <div className="flex items-center gap-3 p-4">
        <Avatar className="size-10">
          <AvatarImage src={resolveTeamImageUrl(team?.avatarURL) ?? ''} alt={name} />
          <AvatarFallback>
            {name ? initials(name) : <Users className="size-5" aria-hidden="true" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-base text-zinc-900 leading-tight dark:text-white">
            <Link
              to="/teams/$teamId"
              params={{ teamId: String(membership.teamId) }}
              className="stretched-link"
            >
              {name}
            </Link>
          </div>
          <div className="mt-0.5 text-sm text-zinc-600 dark:text-slate-400">
            {TeamDisplayRoleLabel[role]}
          </div>
        </div>
      </div>
    </div>
  )
}
