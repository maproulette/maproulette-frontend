import type { TranslateFn } from '@/i18n'
import type { Challenge } from '@/types/Challenge'

/**
 * Cooperative types a challenge can carry, mirroring the backend's
 * `challenges.cooperative_type` column. MR4 does not run cooperative task
 * workflows, but it still labels these challenges so mappers know what they
 * are picking up before they open one.
 */
export const COOPERATIVE_TYPE_NONE = 0
export const COOPERATIVE_TYPE_TAGS = 1
export const COOPERATIVE_TYPE_CHANGEFILE = 2

export const isCooperative = (cooperativeType: number | null | undefined): boolean =>
  cooperativeType === COOPERATIVE_TYPE_TAGS || cooperativeType === COOPERATIVE_TYPE_CHANGEFILE

export type ChallengeTaxonomyKey = 'featured' | 'tagFix' | 'cooperative' | 'global'

export interface ChallengeTaxonomyEntry {
  key: ChallengeTaxonomyKey
  label: string
  /** Colors follow the MR3 taxonomy so the two frontends read the same. */
  className: string
}

/**
 * The taxonomical categories of a challenge -- featured, tag fix, cooperative,
 * global -- in the order they should be shown. Returns an empty array when the
 * challenge is an ordinary one, so callers can skip rendering entirely.
 */
export const getChallengeTaxonomy = (
  challenge: Pick<Challenge, 'featured' | 'cooperativeType' | 'isGlobal'>,
  t: TranslateFn
): ChallengeTaxonomyEntry[] => {
  const entries: ChallengeTaxonomyEntry[] = []

  if (challenge.featured) {
    entries.push({
      key: 'featured',
      label: t('common.featured', undefined, 'Featured'),
      className:
        'border-transparent bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
    })
  }

  if (challenge.cooperativeType === COOPERATIVE_TYPE_TAGS) {
    entries.push({
      key: 'tagFix',
      label: t('common.tagFix', undefined, 'Tag Fix'),
      className:
        'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
    })
  } else if (challenge.cooperativeType === COOPERATIVE_TYPE_CHANGEFILE) {
    entries.push({
      key: 'cooperative',
      label: t('common.cooperative', undefined, 'Cooperative'),
      className:
        'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
    })
  }

  if (challenge.isGlobal) {
    entries.push({
      key: 'global',
      label: t('common.global', undefined, 'Global'),
      className:
        'border-transparent bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
    })
  }

  return entries
}
