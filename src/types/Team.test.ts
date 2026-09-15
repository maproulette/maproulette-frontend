import { describe, expect, it } from 'vitest'
import type { TeamUser } from './Team.ts'
import {
  isPendingInvite,
  isTeamAdmin,
  isTeamOwner,
  roleManagesContent,
  roleManagesMembers,
  roleOwnsTeam,
  TEAM_ROLE_ADMIN,
  TEAM_ROLE_MANAGER,
  TEAM_ROLE_MEMBER,
  TEAM_ROLE_OWNER,
  TeamDisplayRoleLabel,
  teamDisplayRole,
  teamRoleOf,
} from './Team.ts'

type Grant = TeamUser['teamGrants'][number]

const grant = (role: number): Grant => ({ role }) as unknown as Grant

describe('team role constants', () => {
  it('matches the backend ordering, most privileged lowest', () => {
    expect(TEAM_ROLE_OWNER).toBe(0)
    expect(TEAM_ROLE_ADMIN).toBe(1)
    expect(TEAM_ROLE_MANAGER).toBe(2)
    expect(TEAM_ROLE_MEMBER).toBe(3)
  })
})

describe('TeamDisplayRoleLabel', () => {
  it('labels every display role', () => {
    expect(TeamDisplayRoleLabel).toEqual({
      invited: 'Invited',
      member: 'Member',
      manager: 'Manager',
      admin: 'Admin',
      owner: 'Owner',
    })
  })
})

describe('role capabilities', () => {
  it('lets owners, admins and managers run the team’s content', () => {
    expect(roleManagesContent(TEAM_ROLE_OWNER)).toBe(true)
    expect(roleManagesContent(TEAM_ROLE_ADMIN)).toBe(true)
    expect(roleManagesContent(TEAM_ROLE_MANAGER)).toBe(true)
    expect(roleManagesContent(TEAM_ROLE_MEMBER)).toBe(false)
  })

  it('reserves membership changes to owners and admins', () => {
    expect(roleManagesMembers(TEAM_ROLE_OWNER)).toBe(true)
    expect(roleManagesMembers(TEAM_ROLE_ADMIN)).toBe(true)
    expect(roleManagesMembers(TEAM_ROLE_MANAGER)).toBe(false)
    expect(roleManagesMembers(TEAM_ROLE_MEMBER)).toBe(false)
  })

  it('reserves deleting the team to owners', () => {
    expect(roleOwnsTeam(TEAM_ROLE_OWNER)).toBe(true)
    expect(roleOwnsTeam(TEAM_ROLE_ADMIN)).toBe(false)
  })
})

describe('teamRoleOf', () => {
  it('reads the granted role', () => {
    expect(teamRoleOf({ teamGrants: [grant(TEAM_ROLE_MANAGER)] })).toBe(TEAM_ROLE_MANAGER)
  })

  it('takes the most privileged grant when there is more than one', () => {
    expect(teamRoleOf({ teamGrants: [grant(TEAM_ROLE_MEMBER), grant(TEAM_ROLE_OWNER)] })).toBe(
      TEAM_ROLE_OWNER
    )
  })

  it('ignores a role that is not a team role', () => {
    expect(teamRoleOf({ teamGrants: [grant(99)] })).toBe(TEAM_ROLE_MEMBER)
  })

  it('falls back to plain member when there are no grants', () => {
    expect(teamRoleOf({ teamGrants: [] })).toBe(TEAM_ROLE_MEMBER)
  })

  it('falls back to plain member when teamGrants is missing from the payload', () => {
    expect(teamRoleOf({} as unknown as Pick<TeamUser, 'teamGrants'>)).toBe(TEAM_ROLE_MEMBER)
  })
})

describe('isTeamAdmin', () => {
  it('is true for an admin', () => {
    expect(isTeamAdmin({ teamGrants: [grant(TEAM_ROLE_ADMIN)] })).toBe(true)
  })

  it('is true for an owner, who outranks an admin', () => {
    expect(isTeamAdmin({ teamGrants: [grant(TEAM_ROLE_OWNER)] })).toBe(true)
  })

  it('is false for a manager, who runs content but not membership', () => {
    expect(isTeamAdmin({ teamGrants: [grant(TEAM_ROLE_MANAGER)] })).toBe(false)
  })

  it('is false when there are no grants', () => {
    expect(isTeamAdmin({ teamGrants: [] })).toBe(false)
  })

  it('is false when teamGrants is missing from the payload', () => {
    expect(isTeamAdmin({} as unknown as Pick<TeamUser, 'teamGrants'>)).toBe(false)
  })
})

describe('isTeamOwner', () => {
  it('is true only for an owner', () => {
    expect(isTeamOwner({ teamGrants: [grant(TEAM_ROLE_OWNER)] })).toBe(true)
    expect(isTeamOwner({ teamGrants: [grant(TEAM_ROLE_ADMIN)] })).toBe(false)
  })
})

describe('teamDisplayRole', () => {
  it('is "invited" when status is the backend\'s invited status, regardless of grants', () => {
    expect(teamDisplayRole({ status: 1, teamGrants: [grant(TEAM_ROLE_OWNER)] })).toBe('invited')
  })

  it('names each joined role', () => {
    expect(teamDisplayRole({ status: 0, teamGrants: [grant(TEAM_ROLE_OWNER)] })).toBe('owner')
    expect(teamDisplayRole({ status: 0, teamGrants: [grant(TEAM_ROLE_ADMIN)] })).toBe('admin')
    expect(teamDisplayRole({ status: 0, teamGrants: [grant(TEAM_ROLE_MANAGER)] })).toBe('manager')
    expect(teamDisplayRole({ status: 0, teamGrants: [grant(TEAM_ROLE_MEMBER)] })).toBe('member')
  })
})

describe('isPendingInvite', () => {
  it("is true for the backend's invited status", () => {
    expect(isPendingInvite({ status: 1 })).toBe(true)
  })

  it("is false for the backend's joined-member status", () => {
    expect(isPendingInvite({ status: 0 })).toBe(false)
  })
})
