// Query keys for user data that code outside src/api/user also reads or invalidates.
export const userKeys = {
  all: ['user'] as const,
  whoami: ['user', 'whoami'] as const,
}
