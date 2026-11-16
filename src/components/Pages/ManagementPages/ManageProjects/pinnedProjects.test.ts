import { describe, expect, it } from 'vitest'
import type { User } from '@/types/User'
import {
  buildPropertiesWithPinnedChallenges,
  buildPropertiesWithPinnedProjects,
  getPinnedChallengeIds,
  getPinnedProjectIds,
} from './pinnedProjects'

const userWithProperties = (properties: Record<string, unknown> | null | undefined) =>
  ({ properties }) as unknown as User

describe('getPinnedProjectIds', () => {
  it('returns an empty array for a null/undefined user', () => {
    expect(getPinnedProjectIds(null)).toEqual([])
    expect(getPinnedProjectIds(undefined)).toEqual([])
  })

  it('returns an empty array when the user has no properties', () => {
    expect(getPinnedProjectIds(userWithProperties(undefined))).toEqual([])
    expect(getPinnedProjectIds(userWithProperties(null))).toEqual([])
  })

  it('returns an empty array when the mr4 settings are absent', () => {
    expect(getPinnedProjectIds(userWithProperties({}))).toEqual([])
  })

  it('returns an empty array when pinned.projects is absent', () => {
    const properties = { mr4: { settings: { pinned: {} } } }
    expect(getPinnedProjectIds(userWithProperties(properties))).toEqual([])
  })

  it('returns the pinned project ids when present', () => {
    const properties = { mr4: { settings: { pinned: { projects: [1, 2, 3] } } } }
    expect(getPinnedProjectIds(userWithProperties(properties))).toEqual([1, 2, 3])
  })

  it('filters out non-number entries from a malformed pinned.projects array', () => {
    const properties = {
      mr4: { settings: { pinned: { projects: [1, '2', null, 3, undefined] } } },
    }
    expect(getPinnedProjectIds(userWithProperties(properties))).toEqual([1, 3])
  })

  it('returns an empty array when pinned.projects is not an array', () => {
    const properties = { mr4: { settings: { pinned: { projects: 'not-an-array' } } } }
    expect(getPinnedProjectIds(userWithProperties(properties))).toEqual([])
  })

  it('does not confuse pinned challenges with pinned projects', () => {
    const properties = { mr4: { settings: { pinned: { challenges: [9, 10] } } } }
    expect(getPinnedProjectIds(userWithProperties(properties))).toEqual([])
  })

  it('returns an empty array when reading user.properties throws', () => {
    const throwingUser = {} as User
    Object.defineProperty(throwingUser, 'properties', {
      configurable: true,
      get() {
        throw new Error('boom')
      },
    })
    expect(getPinnedProjectIds(throwingUser)).toEqual([])
  })
})

describe('getPinnedChallengeIds', () => {
  it('returns an empty array when absent', () => {
    expect(getPinnedChallengeIds(userWithProperties({}))).toEqual([])
  })

  it('returns the pinned challenge ids when present', () => {
    const properties = { mr4: { settings: { pinned: { challenges: [5, 6] } } } }
    expect(getPinnedChallengeIds(userWithProperties(properties))).toEqual([5, 6])
  })
})

describe('buildPropertiesWithPinnedProjects', () => {
  it('creates the mr4/settings/pinned structure from scratch for a user with no properties', () => {
    const result = buildPropertiesWithPinnedProjects(userWithProperties(undefined), [1, 2])
    expect(result).toEqual({
      mr4: { settings: { pinned: { projects: [1, 2] } } },
    })
  })

  it('preserves unrelated top-level property keys', () => {
    const properties = { someOtherApp: { flag: true } }
    const result = buildPropertiesWithPinnedProjects(userWithProperties(properties), [7])
    expect(result).toEqual({
      someOtherApp: { flag: true },
      mr4: { settings: { pinned: { projects: [7] } } },
    })
  })

  it('preserves other mr4 settings keys alongside the pinned data', () => {
    const properties = { mr4: { settings: { theme: 'dark' } } }
    const result = buildPropertiesWithPinnedProjects(userWithProperties(properties), [7])
    expect(result).toEqual({
      mr4: { settings: { theme: 'dark', pinned: { projects: [7] } } },
    })
  })

  it('preserves pinned challenges while updating pinned projects', () => {
    const properties = { mr4: { settings: { pinned: { challenges: [99] } } } }
    const result = buildPropertiesWithPinnedProjects(userWithProperties(properties), [1])
    expect(result).toEqual({
      mr4: { settings: { pinned: { challenges: [99], projects: [1] } } },
    })
  })

  it('overwrites a previous pinned projects list', () => {
    const properties = { mr4: { settings: { pinned: { projects: [1, 2, 3] } } } }
    const result = buildPropertiesWithPinnedProjects(userWithProperties(properties), [4])
    expect(getPinnedProjectIds(userWithProperties(result))).toEqual([4])
  })

  it('round-trips through getPinnedProjectIds', () => {
    const result = buildPropertiesWithPinnedProjects(userWithProperties(null), [10, 20, 30])
    expect(getPinnedProjectIds(userWithProperties(result))).toEqual([10, 20, 30])
  })
})

describe('buildPropertiesWithPinnedChallenges', () => {
  it('creates the mr4/settings/pinned structure from scratch', () => {
    const result = buildPropertiesWithPinnedChallenges(userWithProperties(undefined), [3])
    expect(result).toEqual({
      mr4: { settings: { pinned: { challenges: [3] } } },
    })
  })

  it('preserves pinned projects while updating pinned challenges', () => {
    const properties = { mr4: { settings: { pinned: { projects: [11] } } } }
    const result = buildPropertiesWithPinnedChallenges(userWithProperties(properties), [22])
    expect(result).toEqual({
      mr4: { settings: { pinned: { projects: [11], challenges: [22] } } },
    })
  })

  it('round-trips through getPinnedChallengeIds', () => {
    const result = buildPropertiesWithPinnedChallenges(userWithProperties(null), [1, 2])
    expect(getPinnedChallengeIds(userWithProperties(result))).toEqual([1, 2])
  })
})
