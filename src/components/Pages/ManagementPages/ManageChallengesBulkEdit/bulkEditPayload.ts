import { basemapSubmission } from '@/components/Map/basemap'
import type { BinaryNode } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import type { Challenge } from '@/types/Challenge'
import { TaskPriority, type TaskPriorityValue } from '@/types/Priority'
import {
  buildChallengeTags,
  removedKeywords,
  splitChallengeKeywords,
} from '../ManageChallengeNew/challengeKeywords'
import {
  draftToPriorityBody,
  parseBoundsString,
} from '../TaskPrioritizationPage/prioritizationParsing'

export const BASEMAP_UNCHANGED = 'unchanged'

export interface BulkPriorities {
  defaultPriority: TaskPriorityValue
  high: BinaryNode | null
  medium: BinaryNode | null
  low: BinaryNode | null
}

export interface BulkEditValues {
  instruction: string
  additionalKeywords: string
  exportableProperties: string
  basemap: string
  basemapUrl: string
  dataOriginDate: string
  replacePriorities: boolean
  priorities: BulkPriorities
}

export type BulkEditField =
  | 'instruction'
  | 'additionalKeywords'
  | 'exportableProperties'
  | 'basemap'
  | 'dataOriginDate'
  | 'priorities'

export const emptyBulkEditValues = (): BulkEditValues => ({
  instruction: '',
  additionalKeywords: '',
  exportableProperties: '',
  basemap: BASEMAP_UNCHANGED,
  basemapUrl: '',
  dataOriginDate: '',
  replacePriorities: false,
  priorities: { defaultPriority: TaskPriority.MEDIUM, high: null, medium: null, low: null },
})

export const normalizeKeywords = (raw: string): string =>
  raw
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword !== '')
    .join(',')

export const changedBulkEditFields = (
  values: Omit<BulkEditValues, 'basemapUrl' | 'priorities'>
): BulkEditField[] => {
  const fields: BulkEditField[] = []
  if (values.instruction.trim() !== '') fields.push('instruction')
  if (normalizeKeywords(values.additionalKeywords) !== '') fields.push('additionalKeywords')
  if (values.exportableProperties.trim() !== '') fields.push('exportableProperties')
  if (values.basemap !== BASEMAP_UNCHANGED) fields.push('basemap')
  if (values.dataOriginDate !== '') fields.push('dataOriginDate')
  if (values.replacePriorities) fields.push('priorities')
  return fields
}

export interface ChallengeBulkUpdate {
  updates: Partial<Challenge>
  removedKeywords: string[]
}

export const buildChallengeBulkUpdate = (
  values: BulkEditValues,
  existingKeywords: string[],
  fields: ReadonlySet<BulkEditField> = new Set(changedBulkEditFields(values))
): ChallengeBulkUpdate => {
  const updates: Partial<Challenge> = {}
  let removed: string[] = []

  if (fields.has('instruction')) updates.instruction = values.instruction

  if (fields.has('additionalKeywords')) {
    const { category } = splitChallengeKeywords(existingKeywords)
    const tags = buildChallengeTags(category, normalizeKeywords(values.additionalKeywords))
    updates.tags = tags
    removed = removedKeywords(existingKeywords, tags)
  }

  if (fields.has('exportableProperties')) {
    updates.exportableProperties = values.exportableProperties.trim()
  }

  if (fields.has('basemap')) {
    Object.assign(updates, basemapSubmission(values.basemap, values.basemapUrl.trim()))
  }

  if (fields.has('dataOriginDate')) {
    updates.dataOriginDate = Date.parse(`${values.dataOriginDate}T00:00:00Z`)
  }

  return { updates, removedKeywords: removed }
}

export const buildPriorityUpdate = (
  priorities: BulkPriorities,
  challenge: Pick<Challenge, 'highPriorityBounds' | 'mediumPriorityBounds' | 'lowPriorityBounds'>
) =>
  draftToPriorityBody({
    defaultPriority: priorities.defaultPriority,
    high: { rules: priorities.high, bounds: parseBoundsString(challenge.highPriorityBounds) },
    medium: { rules: priorities.medium, bounds: parseBoundsString(challenge.mediumPriorityBounds) },
    low: { rules: priorities.low, bounds: parseBoundsString(challenge.lowPriorityBounds) },
  })
