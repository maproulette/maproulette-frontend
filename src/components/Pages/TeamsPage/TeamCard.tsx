import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { api } from '@/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { useIntl } from '@/i18n'
import { cn, initials } from '@/lib/utils'
import type { TeamDisplayRole, TeamUser } from '@/types/Team'
import { TeamDisplayRoleLabel, teamDisplayRole } from '@/types/Team'

interface Props {
  membership: TeamUser
}

const roleBadge: Record<TeamDisplayRole, string> = {
  invited: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  member: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
}

export const TeamCard = ({ membership }: Props) => {
  const { t } = useIntl()
  const { data: team } = api.team.get(membership.teamId)
  const name =
    membership.teamName || t('common.team', { teamId: membership.teamId }, 'Team #{teamId}')
  const role = teamDisplayRole(membership)
  return (
    <Link to="/teams/$teamId" params={{ teamId: String(membership.teamId) }} className="block">
      <Card className="mb-2 flex items-center gap-3 transition-shadow hover:shadow-md">
        <Avatar className="size-10">
          <AvatarImage src={team?.avatarURL ?? ''} alt={name} />
          <AvatarFallback>
            {name ? initials(name) : <Users className="size-5" aria-hidden="true" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{name}</div>
          <span
            className={cn(
              'inline-block rounded-full px-2 py-0.5 font-medium text-xs',
              roleBadge[role]
            )}
          >
            {TeamDisplayRoleLabel[role]}
          </span>
        </div>
      </Card>
    </Link>
  )
}
