/** Project roles, as defined by the server. */
export const PROJECT_ROLE = {
  admin: 1,
  write: 2,
  read: 3,
} as const

export type ProjectRole = (typeof PROJECT_ROLE)[keyof typeof PROJECT_ROLE]

export const projectRoleOptions = [
  {
    value: PROJECT_ROLE.admin,
    label: 'Admin',
    description: 'Full control, including managing other managers',
  },
  { value: PROJECT_ROLE.write, label: 'Write', description: 'Create and edit challenges' },
  { value: PROJECT_ROLE.read, label: 'Read', description: 'View the project and its challenges' },
]

/**
 * Attaching a team stores a role on the grant, but the server ignores it: what
 * each member may do follows the role they hold in the team. A single constant
 * is sent so the stored value is at least consistent.
 */
export const TEAM_ATTACHMENT_ROLE = PROJECT_ROLE.write

export const projectRoleLabel = (role: number): string =>
  projectRoleOptions.find((option) => option.value === role)?.label ?? `Role ${role}`

/**
 * The strongest role in a set of grants. The server numbers roles so that a
 * lower number is more powerful, so a grantee holding several roles is shown
 * as the most capable one.
 */
export const strongestRole = (roles: number[]): number | null =>
  roles.length > 0 ? Math.min(...roles) : null
