import { describe, expect, it } from 'vitest'
import type { TeamUser } from './Team.ts'
import { isPendingInvite, isTeamAdmin, TeamDisplayRoleLabel, teamDisplayRole } from './Team.ts'

type Grant = TeamUser['teamGrants'][number]

const grant = (role: number): Grant => ({ role }) as unknown as Grant

describe('TeamDisplayRoleLabel', () => {
  it('labels every display role', () => {
    expect(TeamDisplayRoleLabel).toEqual({
      invited: 'Invited',
      member: 'Member',
      admin: 'Admin',
    })
  })
})

describe('isTeamAdmin', () => {
  it('is true when the member has an admin-role grant', () => {
    expect(isTeamAdmin({ teamGrants: [grant(1)] })).toBe(true)
  })

  it('is false when the member has only non-admin grants', () => {
    expect(isTeamAdmin({ teamGrants: [grant(2)] })).toBe(false)
  })

  it('is false when there are no grants', () => {
    expect(isTeamAdmin({ teamGrants: [] })).toBe(false)
  })

  it('is false when teamGrants is missing from the payload', () => {
    expect(isTeamAdmin({} as unknown as Pick<TeamUser, 'teamGrants'>)).toBe(false)
  })
})

describe('teamDisplayRole', () => {
  it('is "invited" when status is the backend\'s invited status, regardless of grants', () => {
    expect(teamDisplayRole({ status: 1, teamGrants: [grant(1)] })).toBe('invited')
  })

  it('is "admin" when joined with an admin-role grant', () => {
    expect(teamDisplayRole({ status: 0, teamGrants: [grant(1)] })).toBe('admin')
  })

  it('is "member" when joined without an admin-role grant', () => {
    expect(teamDisplayRole({ status: 0, teamGrants: [grant(2)] })).toBe('member')
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
