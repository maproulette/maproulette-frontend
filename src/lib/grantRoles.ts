import type { Challenge } from '@/types/Challenge'
import type { User } from '@/types/User'

// Grant role constants (mirrors backend org.maproulette.framework.model.Grant).
// Lower is more powerful, so every check reads `role <= REQUIRED`.
export const ROLE_SUPER_USER = -1
export const ROLE_ADMIN = 1
export const ROLE_WRITE_ACCESS = 2

// Item type constants (mirrors org.maproulette.data.Actions).
const ITEM_TYPE_PROJECT = 0
const ITEM_TYPE_CHALLENGE = 1
const ITEM_TYPE_USER = 5
const ITEM_TYPE_GROUP = 6

/**
 * A grant as it actually arrives on the wire.
 *
 * The generated schema types `granteeType` and `objectType` as `ItemType`
 * objects, but the backend's hand-written writers emit `typeId` — a plain
 * integer. This describes what is really there, so the comparisons below are
 * against numbers rather than objects that never arrive.
 */
interface WireGrant {
  role: number
  grantee?: { granteeType?: number; granteeId?: number }
  target?: { objectType?: number; objectId?: number }
}

const grantsOf = (user: User | null | undefined): WireGrant[] =>
  ((user?.grants ?? []) as unknown as WireGrant[]) ?? []

export const isSuperUser = (user: User | null | undefined): boolean =>
  grantsOf(user).some((grant) => grant.role === ROLE_SUPER_USER)

/**
 * The roles a user holds on a target by a grant made to them personally.
 *
 * The server folds the project grants of every team a user belongs to into
 * their grant list, so a grant found against a project is not necessarily
 * theirs. Only grants made to the person count here; what a team confers is
 * `rolesThroughTeams`.
 */
const ownRolesOn = (
  user: User | null | undefined,
  objectType: number,
  objectId: number
): number[] =>
  grantsOf(user)
    .filter(
      (grant) =>
        // An older payload may omit the grantee; treat that as the user's own,
        // which is what it meant before teams could hold a grant.
        (grant.grantee?.granteeType ?? ITEM_TYPE_USER) === ITEM_TYPE_USER &&
        grant.target?.objectType === objectType &&
        grant.target?.objectId === objectId
    )
    .map((grant) => grant.role)

/** The user's role in a team, or undefined if they hold none. */
const roleInTeam = (user: User | null | undefined, teamId: number): number | undefined => {
  const roles = grantsOf(user)
    .filter(
      (grant) =>
        (grant.grantee?.granteeType ?? ITEM_TYPE_USER) === ITEM_TYPE_USER &&
        grant.target?.objectType === ITEM_TYPE_GROUP &&
        grant.target?.objectId === teamId
    )
    .map((grant) => grant.role)

  return roles.length > 0 ? Math.min(...roles) : undefined
}

/**
 * The roles a user picks up on a target through teams associated with it —
 * whether a team is attached to it by grant, or owns it outright, which confer
 * alike.
 *
 * What someone gets is the role they hold in the team, carried across
 * unchanged: team roles are the generic grant roles under team-facing names, so
 * an owner's 0 satisfies a check for admin and a manager's 2 one for write. A
 * plain member gets nothing — belonging to a team is not running its work.
 */
const rolesThroughTeams = (
  user: User | null | undefined,
  objectType: number,
  objectId: number,
  ownerTeamId?: number | null
): number[] => {
  const attachedTeamIds = grantsOf(user)
    .filter(
      (grant) =>
        grant.grantee?.granteeType === ITEM_TYPE_GROUP &&
        grant.target?.objectType === objectType &&
        grant.target?.objectId === objectId
    )
    .map((grant) => grant.grantee?.granteeId)
    .filter((id): id is number => id != null)

  const teamIds = ownerTeamId != null ? [...attachedTeamIds, ownerTeamId] : attachedTeamIds

  return teamIds
    .map((teamId) => roleInTeam(user, teamId))
    .filter((role): role is number => role != null && role <= ROLE_WRITE_ACCESS)
}

/**
 * The strongest role a user holds on a project, counting every route by which
 * access arrives. Mirrors Permission.effectiveRole on the server.
 *
 * Like the server, this reads granted roles rather than accepted memberships,
 * so someone invited to a team but yet to accept looks like a member. That is
 * the lenient direction, and the server — which does require an accepted
 * membership — refuses anything real.
 */
export const effectiveProjectRole = (
  user: User | null | undefined,
  projectId: number | undefined,
  ownerTeamId?: number | null
): number | undefined => {
  if (!user || projectId == null) return undefined
  if (isSuperUser(user)) return ROLE_SUPER_USER

  const roles = [
    ...ownRolesOn(user, ITEM_TYPE_PROJECT, projectId),
    ...rolesThroughTeams(user, ITEM_TYPE_PROJECT, projectId, ownerTeamId),
  ]

  return roles.length > 0 ? Math.min(...roles) : undefined
}

/**
 * The strongest role a user holds on a challenge itself — by a grant to them,
 * by a team attached to it, or by the team that owns it. Does not consider the
 * parent project; `canManageChallenge` falls back to that.
 */
export const effectiveChallengeRole = (
  user: User | null | undefined,
  challenge: Challenge | null | undefined
): number | undefined => {
  if (!user || challenge?.id == null) return undefined
  if (isSuperUser(user)) return ROLE_SUPER_USER

  const roles = [
    ...ownRolesOn(user, ITEM_TYPE_CHALLENGE, challenge.id),
    ...rolesThroughTeams(user, ITEM_TYPE_CHALLENGE, challenge.id, challenge.ownerTeamId),
  ]

  return roles.length > 0 ? Math.min(...roles) : undefined
}
