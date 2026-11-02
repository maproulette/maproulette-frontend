import { describe, expect, it } from 'vitest'
import {
  PROJECT_ROLE,
  projectRoleOptions,
  strongestRole,
} from './projectRoles.ts'

describe('projectRoleOptions', () => {
  it('covers every role the server defines', () => {
    expect(projectRoleOptions.map((o) => o.value)).toEqual([
      PROJECT_ROLE.admin,
      PROJECT_ROLE.write,
      PROJECT_ROLE.read,
    ])
  })
})

describe('strongestRole', () => {
  it('is null when no roles are held', () => {
    expect(strongestRole([])).toBeNull()
  })

  it('picks the most capable role, which is the lowest number', () => {
    expect(strongestRole([PROJECT_ROLE.read, PROJECT_ROLE.admin])).toBe(PROJECT_ROLE.admin)
    expect(strongestRole([PROJECT_ROLE.read, PROJECT_ROLE.write])).toBe(PROJECT_ROLE.write)
  })

  it('handles a single role', () => {
    expect(strongestRole([PROJECT_ROLE.write])).toBe(PROJECT_ROLE.write)
  })
})
