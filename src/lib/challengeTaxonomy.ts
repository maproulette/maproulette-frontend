import type { TranslateFn } from '@/i18n'
import type { Challenge } from '@/types/Challenge'

/**
 * Cooperative types a challenge can carry, mirroring the backend's
 * `challenges.cooperative_type` column, labelled so mappers know what they
 * are picking up before they open one.
 */
export const COOPERATIVE_TYPE_NONE = 0
export const COOPERATIVE_TYPE_TAGS = 1
export const COOPERATIVE_TYPE_CHANGEFILE = 2

export const isCooperative = (cooperativeType: number | null | undefined): boolean =>
  cooperativeType === COOPERATIVE_TYPE_TAGS || cooperativeType === COOPERATIVE_TYPE_CHANGEFILE

type ChallengeTaxonomyKey = 'featured' | 'tagFix' | 'cooperative' | 'global'

export interface ChallengeTaxonomyEntry {
  key: ChallengeTaxonomyKey
  label: string
  className: string
}

/**
 * The taxonomical categories of a challenge -- featured, tag fix, cooperative,
 * global -- in the order they should be shown. Returns an empty array when the
 * challenge is an ordinary one, so callers can skip rendering entirely.
 */
export const getChallengeTaxonomy = (
  challenge: Partial<Pick<Challenge, 'featured' | 'cooperativeType' | 'isGlobal'>>,
  t: TranslateFn
): ChallengeTaxonomyEntry[] => {
  const entries: ChallengeTaxonomyEntry[] = []

  if (challenge.featured) {
    entries.push({
      key: 'featured',
      label: t({ id: 'common.featured', defaultMessage: 'Featured' }),
      className:
        'border-transparent bg-mango-200 text-mango-800 dark:border-highlight/50 dark:bg-transparent dark:text-highlight',
    })
  }

  if (challenge.cooperativeType === COOPERATIVE_TYPE_TAGS) {
    entries.push({
      key: 'tagFix',
      label: t({ id: 'common.tagFix', defaultMessage: 'Tag Fix' }),
      className:
        'border-transparent bg-mint-200 text-mint-800 dark:border-link/50 dark:bg-transparent dark:text-link',
    })
  } else if (challenge.cooperativeType === COOPERATIVE_TYPE_CHANGEFILE) {
    entries.push({
      key: 'cooperative',
      label: t({ id: 'common.cooperative', defaultMessage: 'Cooperative' }),
      className:
        'border-transparent bg-mint-200 text-mint-800 dark:border-link/50 dark:bg-transparent dark:text-link',
    })
  }

  if (challenge.isGlobal) {
    entries.push({
      key: 'global',
      label: t({ id: 'common.global', defaultMessage: 'Global' }),
      className:
        'border-transparent bg-ocean-200 text-ocean-800 dark:border-ocean-300/50 dark:bg-transparent dark:text-ocean-300',
    })
  }

  return entries
}
