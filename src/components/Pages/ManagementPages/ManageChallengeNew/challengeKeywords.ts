export const CHALLENGE_CATEGORY_KEYWORDS = {
  navigation: ['highway'],
  water: ['natural', 'water'],
  pointsOfInterest: ['amenity', 'leisure'],
  buildings: ['building'],
  landUse: ['landuse', 'boundary'],
  transit: ['railway', 'public_transport'],
  other: [],
} as const satisfies Record<string, readonly string[]>

export type ChallengeCategory = keyof typeof CHALLENGE_CATEGORY_KEYWORDS

export const CHALLENGE_CATEGORIES = Object.keys(CHALLENGE_CATEGORY_KEYWORDS) as [
  ChallengeCategory,
  ...ChallengeCategory[],
]

const RAW_CATEGORY_KEYWORDS: readonly string[] = Object.values(CHALLENGE_CATEGORY_KEYWORDS).flat()

export const categoryMatchingKeywords = (keywords: readonly string[]): ChallengeCategory =>
  CHALLENGE_CATEGORIES.find((category) =>
    (CHALLENGE_CATEGORY_KEYWORDS[category] as readonly string[]).some((keyword) =>
      keywords.includes(keyword)
    )
  ) ?? 'other'

export const splitChallengeKeywords = (
  tags: readonly string[] | null | undefined
): { category: ChallengeCategory; additionalKeywords: string } => {
  const keywords = (tags ?? []).filter((tag) => tag !== '')
  return {
    category: categoryMatchingKeywords(keywords),
    additionalKeywords: keywords
      .filter((keyword) => !RAW_CATEGORY_KEYWORDS.includes(keyword))
      .join(','),
  }
}

export const buildChallengeTags = (
  category: ChallengeCategory,
  additionalKeywords: string | undefined
): string[] => [
  ...(CHALLENGE_CATEGORY_KEYWORDS[category] ?? CHALLENGE_CATEGORY_KEYWORDS.other),
  ...(additionalKeywords ?? '').split(/,+/).filter((keyword) => keyword !== ''),
]
