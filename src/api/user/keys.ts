// Query keys for user data that code outside src/api/user also reads or invalidates.
export const userKeys = {
  all: ['user'] as const,
  whoami: ['user', 'whoami'] as const,
  /** Prefix of everything cached about one user. */
  user: (userId: number | undefined) => ['user', userId] as const,
  lockedTasks: (userId: number | undefined) => ['user', userId, 'lockedTasks'] as const,
  teamMemberships: (userId: number | undefined) => ['user', userId, 'teamMemberships'] as const,
  /** Prefix of every user's notifications. */
  notifications: ['user', 'notifications'] as const,
}
