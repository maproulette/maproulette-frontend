import type { components } from './openApiTypes'

export type Team = components['schemas']['org.maproulette.framework.model.Group']
export type TeamUser = components['schemas']['org.maproulette.framework.model.TeamUser']

// Matches the backend's org.maproulette.framework.model.TeamRole, which is the
// generic Grant roles under team-facing names. They are ordered by privilege
// with the lowest number the most powerful, so `role <= TEAM_ROLE_ADMIN` reads
// as "admin or better" here exactly as it does server-side.
export type TeamRole = 0 | 1 | 2 | 3
export const TEAM_ROLE_OWNER: TeamRole = 0
export const TEAM_ROLE_ADMIN: TeamRole = 1
export const TEAM_ROLE_MANAGER: TeamRole = 2
export const TEAM_ROLE_MEMBER: TeamRole = 3

/** The roles, most privileged first, for role pickers. */
export const TEAM_ROLES: TeamRole[] = [
  TEAM_ROLE_OWNER,
  TEAM_ROLE_ADMIN,
  TEAM_ROLE_MANAGER,
  TEAM_ROLE_MEMBER,
]

// Matches the backend's org.maproulette.framework.model.TeamMember.STATUS_INVITED.
// A membership's `status` only ever distinguishes invited-vs-joined — which
// role a joined member holds is tracked separately via `teamGrants`, not status.
const TEAM_STATUS_INVITED = 1

export type TeamDisplayRole = 'invited' | 'member' | 'manager' | 'admin' | 'owner'

export const TeamDisplayRoleLabel: Record<TeamDisplayRole, string> = {
  invited: 'Invited',
  member: 'Member',
  manager: 'Manager',
  admin: 'Admin',
  owner: 'Owner',
}

const ROLE_DISPLAY: Record<TeamRole, TeamDisplayRole> = {
  [TEAM_ROLE_OWNER]: 'owner',
  [TEAM_ROLE_ADMIN]: 'admin',
  [TEAM_ROLE_MANAGER]: 'manager',
  [TEAM_ROLE_MEMBER]: 'member',
}

/**
 * The role a membership holds. A member is granted exactly one team role, but
 * the most privileged grant wins if that ever stops being true — the same rule
 * the backend applies. Falls back to plain member when no team grant is
 * present, which is the least the membership can mean.
 */
export const teamRoleOf = (member: Pick<TeamUser, 'teamGrants'>): TeamRole => {
  const roles = (member.teamGrants ?? [])
    .map((grant) => grant.role)
    .filter((role): role is TeamRole => role in ROLE_DISPLAY)
  return roles.length > 0 ? (Math.min(...roles) as TeamRole) : TEAM_ROLE_MEMBER
}

/** The display name for a role, for role pickers and badges. */
export const roleDisplayName = (role: TeamRole): TeamDisplayRole => ROLE_DISPLAY[role]

/** Whether the role may create, edit and delete the team's projects and challenges. */
export const roleManagesContent = (role: TeamRole): boolean => role <= TEAM_ROLE_MANAGER

/** Whether the role may invite members, remove them and set their roles. */
export const roleManagesMembers = (role: TeamRole): boolean => role <= TEAM_ROLE_ADMIN

/** Whether the role may delete the team outright. */
export const roleOwnsTeam = (role: TeamRole): boolean => role <= TEAM_ROLE_OWNER

/** Whether this member may invite and remove people, i.e. is an admin or the owner. */
export const isTeamAdmin = (member: Pick<TeamUser, 'teamGrants'>): boolean =>
  roleManagesMembers(teamRoleOf(member))

/** Whether this member owns the team, and so may delete it. */
export const isTeamOwner = (member: Pick<TeamUser, 'teamGrants'>): boolean =>
  roleOwnsTeam(teamRoleOf(member))

/** The role to display for a team membership. A pending invite outranks it. */
export const teamDisplayRole = (
  member: Pick<TeamUser, 'status' | 'teamGrants'>
): TeamDisplayRole => {
  if (isPendingInvite(member)) return 'invited'
  return ROLE_DISPLAY[teamRoleOf(member)]
}

/** Whether a membership is still a pending invitation (as opposed to joined). */
export const isPendingInvite = (member: Pick<TeamUser, 'status'>): boolean =>
  member.status === TEAM_STATUS_INVITED

/**
 * A team the current user runs the content of, as offered by
 * `GET /api/v2/teams/managed`. `challengeImageUrl` is absent when the team has
 * no approved image, so a client can tell "no picture" from "failed to load".
 */
export interface ManagedTeam {
  team: Team
  role: TeamRole
  roleName: string
  challengeImageUrl?: string | null
}
