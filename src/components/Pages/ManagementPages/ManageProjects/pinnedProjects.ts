import type { User } from '@/types/User'

const MR4_APP_ID = 'mr4'
const PINNED_KEY = 'pinned'
const PROJECTS_KEY = 'projects'
const CHALLENGES_KEY = 'challenges'

const getPinned = (user: User | null | undefined): Record<string, unknown> => {
  const props = parseUserProperties(user)
  const settings = props[MR4_APP_ID] as Record<string, unknown> | undefined
  const pinned = (settings?.settings as Record<string, unknown> | undefined)?.[PINNED_KEY]
  return (pinned as Record<string, unknown>) ?? {}
}

const parseUserProperties = (user: User | null | undefined): Record<string, unknown> => {
  try {
    if (!user?.properties) return {}
    return user.properties as Record<string, unknown>
  } catch {
    return {}
  }
}

export const getPinnedProjectIds = (user: User | null | undefined): number[] => {
  const ids = getPinned(user)?.[PROJECTS_KEY]
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === 'number') : []
}

export const getPinnedChallengeIds = (user: User | null | undefined): number[] => {
  const ids = getPinned(user)?.[CHALLENGES_KEY]
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === 'number') : []
}

const withPinned = (
  user: User | null | undefined,
  update: (pinned: Record<string, unknown>) => Record<string, unknown>
): Record<string, unknown> => {
  const existing = parseUserProperties(user)
  const mr4 = (existing[MR4_APP_ID] as Record<string, unknown> | undefined) ?? {}
  const settings = (mr4.settings as Record<string, unknown> | undefined) ?? {}
  const pinned = (settings[PINNED_KEY] as Record<string, unknown> | undefined) ?? {}
  return {
    ...existing,
    [MR4_APP_ID]: {
      ...mr4,
      settings: {
        ...settings,
        [PINNED_KEY]: update(pinned),
      },
    },
  }
}

export const buildPropertiesWithPinnedProjects = (
  user: User | null | undefined,
  pinnedProjectIds: number[]
): Record<string, unknown> => {
  return withPinned(user, (pinned) => ({ ...pinned, [PROJECTS_KEY]: pinnedProjectIds }))
}

export const buildPropertiesWithPinnedChallenges = (
  user: User | null | undefined,
  pinnedChallengeIds: number[]
): Record<string, unknown> => {
  return withPinned(user, (pinned) => ({ ...pinned, [CHALLENGES_KEY]: pinnedChallengeIds }))
}
