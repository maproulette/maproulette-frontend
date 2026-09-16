import { describe, expect, it } from 'vitest'
import type { Challenge } from '@/types/Challenge'
import type { User } from '@/types/User'
import { canManageChallenge } from './challengePermissions.ts'

const ROLE_SUPER_USER = -1
const ROLE_ADMIN = 1
const ROLE_WRITE_ACCESS = 2
const ROLE_READ_ONLY = 3

// Item types as the backend emits them (org.maproulette.data.Actions).
const TYPE_PROJECT = 0
const TYPE_CHALLENGE = 1
const TYPE_USER = 5
const TYPE_GROUP = 6

type GrantFixture = {
  role: number
  targetId?: number
  /** Defaults to a project, which is what most grants target. */
  targetType?: number
  /** Defaults to the user themselves; set TYPE_GROUP for a team's grant. */
  granteeType?: number
  granteeId?: number
}

function makeUser(props: { osmId?: number; grants?: GrantFixture[] } = {}): User {
  return {
    osmProfile: props.osmId != null ? { id: props.osmId } : undefined,
    grants: props.grants?.map((g) => ({
      role: g.role,
      grantee: { granteeType: g.granteeType ?? TYPE_USER, granteeId: g.granteeId ?? 1 },
      target:
        g.targetId != null
          ? { objectType: g.targetType ?? TYPE_PROJECT, objectId: g.targetId }
          : undefined,
    })),
  } as unknown as User
}

function makeChallenge(
  props: { owner?: number; parent?: number; id?: number; ownerTeamId?: number } = {}
): Challenge {
  return {
    id: props.id,
    owner: props.owner,
    parent: props.parent,
    ownerTeamId: props.ownerTeamId,
  } as Challenge
}

describe('canManageChallenge', () => {
  it('returns false when the user is missing', () => {
    const user = null
    const challenge = makeChallenge({ owner: 1, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(false)
  })

  it('returns false when the challenge is missing', () => {
    const user = makeUser({ osmId: 1 })
    const challenge = null
    expect(canManageChallenge(user, challenge)).toBe(false)
  })

  it('returns true when the user is the challenge owner', () => {
    const user = makeUser({ osmId: 42 })
    const challenge = makeChallenge({ owner: 42, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(true)
  })

  it('returns true when the user holds a super-user grant', () => {
    const user = makeUser({ osmId: 1, grants: [{ role: ROLE_SUPER_USER }] })
    const challenge = makeChallenge({ owner: 999, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(true)
  })

  it('returns true when the user has admin access on the parent project', () => {
    const user = makeUser({ osmId: 1, grants: [{ role: ROLE_ADMIN, targetId: 10 }] })
    const challenge = makeChallenge({ owner: 999, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(true)
  })

  it('returns true when the user has write access on the parent project', () => {
    const user = makeUser({ osmId: 1, grants: [{ role: ROLE_WRITE_ACCESS, targetId: 10 }] })
    const challenge = makeChallenge({ owner: 999, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(true)
  })

  it('matches a project grant when the parent is embedded rather than an id', () => {
    // The team and saved-challenge endpoints embed the whole project, so the
    // grant target has to be compared against the parent's id either way.
    const user = makeUser({ osmId: 99, grants: [{ role: ROLE_ADMIN, targetId: 10 }] })
    const challenge = {
      owner: 1,
      parent: { id: 10, name: 'Embedded Project' },
    } as unknown as Challenge
    expect(canManageChallenge(user, challenge)).toBe(true)
  })

  it('returns false when the only grant is on a different project', () => {
    const user = makeUser({ osmId: 1, grants: [{ role: ROLE_ADMIN, targetId: 99 }] })
    const challenge = makeChallenge({ owner: 999, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(false)
  })

  it('returns false when the project grant is read-only', () => {
    const user = makeUser({ osmId: 1, grants: [{ role: ROLE_READ_ONLY, targetId: 10 }] })
    const challenge = makeChallenge({ owner: 999, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(false)
  })

  it('returns false for an unrelated user with no grants', () => {
    const user = makeUser({ osmId: 1 })
    const challenge = makeChallenge({ owner: 999, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(false)
  })

  it('does not mistake a grant on a team for one on a project with the same id', () => {
    // Project and group ids come from separate sequences, so a collision is
    // ordinary. Matching on the id alone would let a team role stand in for a
    // project role.
    const user = makeUser({
      osmId: 1,
      grants: [{ role: ROLE_ADMIN, targetId: 10, targetType: TYPE_GROUP }],
    })
    const challenge = makeChallenge({ owner: 999, parent: 10 })
    expect(canManageChallenge(user, challenge)).toBe(false)
  })

  it('returns false when the challenge has no parent project, even with a matching grant', () => {
    const user = makeUser({ osmId: 1, grants: [{ role: ROLE_ADMIN, targetId: 10 }] })
    const challenge = makeChallenge({ owner: 999, parent: undefined })
    expect(canManageChallenge(user, challenge)).toBe(false)
  })
})

describe('canManageChallenge through a team', () => {
  // The server folds the project grants of a user's teams into their grant
  // list, so these arrive looking much like the user's own.
  const teamProjectGrant = {
    role: ROLE_ADMIN,
    targetId: 10,
    granteeType: TYPE_GROUP,
    granteeId: 77,
  }
  const teamChallengeGrant = {
    role: ROLE_ADMIN,
    targetId: 500,
    targetType: TYPE_CHALLENGE,
    granteeType: TYPE_GROUP,
    granteeId: 77,
  }
  const roleInTeam = (role: number) => ({ role, targetId: 77, targetType: TYPE_GROUP })

  it('lets an admin of a team attached to the project manage the challenge', () => {
    const user = makeUser({ osmId: 1, grants: [roleInTeam(ROLE_ADMIN), teamProjectGrant] })
    expect(canManageChallenge(user, makeChallenge({ owner: 999, parent: 10 }))).toBe(true)
  })

  it('lets a manager of that team manage it', () => {
    const user = makeUser({ osmId: 1, grants: [roleInTeam(ROLE_WRITE_ACCESS), teamProjectGrant] })
    expect(canManageChallenge(user, makeChallenge({ owner: 999, parent: 10 }))).toBe(true)
  })

  it('gives a plain member of that team nothing, whatever the grant says', () => {
    // The grant names admin; the member's standing in the team is what counts,
    // and the server refuses them, so the controls must not be offered.
    const user = makeUser({ osmId: 1, grants: [roleInTeam(ROLE_READ_ONLY), teamProjectGrant] })
    expect(canManageChallenge(user, makeChallenge({ owner: 999, parent: 10 }))).toBe(false)
  })

  it('gives nothing to someone who is not on the team', () => {
    const user = makeUser({ osmId: 1, grants: [teamProjectGrant] })
    expect(canManageChallenge(user, makeChallenge({ owner: 999, parent: 10 }))).toBe(false)
  })

  it('lets a manager of a team attached to the challenge itself manage it', () => {
    const user = makeUser({ osmId: 1, grants: [roleInTeam(ROLE_WRITE_ACCESS), teamChallengeGrant] })
    expect(canManageChallenge(user, makeChallenge({ owner: 999, parent: 10, id: 500 }))).toBe(true)
  })

  it('lets a manager of the team that owns the challenge manage it', () => {
    // No grant on the challenge or its project at all -- ownership is the only
    // route in, and it was previously invisible to this check.
    const user = makeUser({ osmId: 1, grants: [roleInTeam(ROLE_WRITE_ACCESS)] })
    const challenge = makeChallenge({ owner: 999, parent: 10, id: 500, ownerTeamId: 77 })
    expect(canManageChallenge(user, challenge)).toBe(true)
  })

  it('still gives a plain member of the owning team nothing', () => {
    const user = makeUser({ osmId: 1, grants: [roleInTeam(ROLE_READ_ONLY)] })
    const challenge = makeChallenge({ owner: 999, parent: 10, id: 500, ownerTeamId: 77 })
    expect(canManageChallenge(user, challenge)).toBe(false)
  })
})
