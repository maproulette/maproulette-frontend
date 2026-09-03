import { describe, expect, it } from 'vitest'
import type { TranslateFn } from '@/i18n'
import {
  COOPERATIVE_TYPE_CHANGEFILE,
  COOPERATIVE_TYPE_NONE,
  COOPERATIVE_TYPE_TAGS,
  getChallengeTaxonomy,
  isCooperative,
} from './challengeTaxonomy'

const t: TranslateFn = (id, _values, defaultMessage) => defaultMessage ?? id

type TaxonomyInput = Parameters<typeof getChallengeTaxonomy>[0]

const challenge = (overrides: Partial<TaxonomyInput> = {}): TaxonomyInput => ({
  featured: false,
  cooperativeType: COOPERATIVE_TYPE_NONE,
  isGlobal: false,
  ...overrides,
})

const keysFor = (overrides: Partial<TaxonomyInput>) =>
  getChallengeTaxonomy(challenge(overrides), t).map((entry) => entry.key)

describe('cooperative types', () => {
  it('mirrors the backend cooperative_type column', () => {
    expect([COOPERATIVE_TYPE_NONE, COOPERATIVE_TYPE_TAGS, COOPERATIVE_TYPE_CHANGEFILE]).toEqual([
      0, 1, 2,
    ])
  })
})

describe('isCooperative', () => {
  it('is true for both tag-fix and changefile challenges', () => {
    expect(isCooperative(COOPERATIVE_TYPE_TAGS)).toBe(true)
    expect(isCooperative(COOPERATIVE_TYPE_CHANGEFILE)).toBe(true)
  })

  it('is false for ordinary challenges and missing values', () => {
    expect(isCooperative(COOPERATIVE_TYPE_NONE)).toBe(false)
    expect(isCooperative(null)).toBe(false)
    expect(isCooperative(undefined)).toBe(false)
  })
})

describe('getChallengeTaxonomy', () => {
  it('returns nothing for an ordinary challenge', () => {
    expect(getChallengeTaxonomy(challenge(), t)).toEqual([])
  })

  it('labels a featured challenge', () => {
    const [entry] = getChallengeTaxonomy(challenge({ featured: true }), t)
    expect(entry).toMatchObject({ key: 'featured', label: 'Featured' })
    expect(entry.className).toContain('teal')
  })

  it('labels a tag fix challenge', () => {
    const [entry] = getChallengeTaxonomy(challenge({ cooperativeType: COOPERATIVE_TYPE_TAGS }), t)
    expect(entry).toMatchObject({ key: 'tagFix', label: 'Tag Fix' })
    expect(entry.className).toContain('rose')
  })

  it('labels a changefile challenge as cooperative', () => {
    const [entry] = getChallengeTaxonomy(
      challenge({ cooperativeType: COOPERATIVE_TYPE_CHANGEFILE }),
      t
    )
    expect(entry).toMatchObject({ key: 'cooperative', label: 'Cooperative' })
    expect(entry.className).toContain('rose')
  })

  it('labels a global challenge', () => {
    const [entry] = getChallengeTaxonomy(challenge({ isGlobal: true }), t)
    expect(entry).toMatchObject({ key: 'global', label: 'Global' })
    expect(entry.className).toContain('violet')
  })

  it('orders featured, cooperative, then global', () => {
    expect(
      keysFor({ featured: true, cooperativeType: COOPERATIVE_TYPE_CHANGEFILE, isGlobal: true })
    ).toEqual(['featured', 'cooperative', 'global'])
  })

  it('never labels a challenge as both tag fix and cooperative', () => {
    expect(
      keysFor({ featured: true, cooperativeType: COOPERATIVE_TYPE_TAGS, isGlobal: true })
    ).toEqual(['featured', 'tagFix', 'global'])
  })

  it('uses translated labels when the catalog has them', () => {
    const translated: TranslateFn = (id) => `translated:${id}`
    expect(
      getChallengeTaxonomy(challenge({ featured: true, isGlobal: true }), translated).map(
        (e) => e.label
      )
    ).toEqual(['translated:common.featured', 'translated:common.global'])
  })
})
