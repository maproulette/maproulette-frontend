import type { components } from './openApiTypes'

export type Team = components['schemas']['org.maproulette.framework.model.Group']
export type TeamUser = components['schemas']['org.maproulette.framework.model.TeamUser']

// Matches the backend's org.maproulette.framework.model.Grant role constants
// (ROLE_ADMIN / ROLE_WRITE_ACCESS) — these are the only two roles the Teams
// UI exposes to invite/promote/demote with.
export type TeamRole = 1 | 2
export const TEAM_ROLE_ADMIN: TeamRole = 1
export const TEAM_ROLE_MEMBER: TeamRole = 2

// Matches the backend's org.maproulette.framework.model.TeamMember.STATUS_INVITED.
// A membership's `status` only ever distinguishes invited-vs-joined — whether
// a joined member is an admin is tracked separately via `teamGrants`, not status.
const TEAM_STATUS_INVITED = 1

export type TeamDisplayRole = 'invited' | 'member' | 'admin'

export const TeamDisplayRoleLabel: Record<TeamDisplayRole, string> = {
  invited: 'Invited',
  member: 'Member',
  admin: 'Admin',
}

/** Whether this member has been granted the team's admin role. */
export const isTeamAdmin = (member: Pick<TeamUser, 'teamGrants'>): boolean =>
  (member.teamGrants ?? []).some((grant) => grant.role === TEAM_ROLE_ADMIN)

/** The role to display for a team membership: invited, plain member, or admin. */
export const teamDisplayRole = (
  member: Pick<TeamUser, 'status' | 'teamGrants'>
): TeamDisplayRole => {
  if (isPendingInvite(member)) return 'invited'
  return isTeamAdmin(member) ? 'admin' : 'member'
}

/** Whether a membership is still a pending invitation (as opposed to joined). */
export const isPendingInvite = (member: Pick<TeamUser, 'status'>): boolean =>
  member.status === TEAM_STATUS_INVITED
