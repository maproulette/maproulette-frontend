import { defineMessage, type MessageDescriptor } from 'react-intl'

/** Project roles, as defined by the server. */
export const PROJECT_ROLE = {
  admin: 1,
  write: 2,
  read: 3,
} as const

export const projectRoleOptions: {
  value: number
  label: MessageDescriptor
  description: MessageDescriptor
}[] = [
  {
    value: PROJECT_ROLE.admin,
    label: defineMessage({ id: 'projectRoles.admin', defaultMessage: 'Admin' }),
    description: defineMessage({
      id: 'projectRoles.adminDescription',
      defaultMessage: 'Full control, including managing other managers',
    }),
  },
  {
    value: PROJECT_ROLE.write,
    label: defineMessage({ id: 'projectRoles.write', defaultMessage: 'Write' }),
    description: defineMessage({
      id: 'projectRoles.writeDescription',
      defaultMessage: 'Create and edit challenges',
    }),
  },
  {
    value: PROJECT_ROLE.read,
    label: defineMessage({ id: 'projectRoles.read', defaultMessage: 'Read' }),
    description: defineMessage({
      id: 'projectRoles.readDescription',
      defaultMessage: 'View the project and its challenges',
    }),
  },
]

/**
 * Attaching a team stores a role on the grant, but the server ignores it: what
 * each member may do follows the role they hold in the team. A single constant
 * is sent so the stored value is at least consistent.
 */
export const TEAM_ATTACHMENT_ROLE = PROJECT_ROLE.write

/**
 * The strongest role in a set of grants. The server numbers roles so that a
 * lower number is more powerful, so a grantee holding several roles is shown
 * as the most capable one.
 */
export const strongestRole = (roles: number[]): number | null =>
  roles.length > 0 ? Math.min(...roles) : null
