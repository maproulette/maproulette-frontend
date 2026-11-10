import type { UserProperties } from '@/types/User'
import { getAppSetting, MR_APP_ID, withAppSetting } from './userProperties'

const CATEGORIZATION_SETTING = 'categorizationKeys'

export const MAX_CATEGORIZATION_KEYWORDS = 6

export const savedCategorizationKeywords = (
  properties: UserProperties | null | undefined
): string[] => {
  const keywords = getAppSetting(properties, MR_APP_ID, CATEGORIZATION_SETTING)
  return Array.isArray(keywords)
    ? keywords.filter((keyword): keyword is string => typeof keyword === 'string')
    : []
}

export const withCategorizationKeywords = (
  properties: UserProperties | null | undefined,
  keywords: string[]
): UserProperties => withAppSetting(properties, MR_APP_ID, CATEGORIZATION_SETTING, keywords)
