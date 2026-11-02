import type { Challenge } from '@/types/Challenge'
import { buildFormValues, type ChallengeFormValues } from './challengeFormSchema'

const CLONED_SETTINGS = [
  'blurb',
  'cooperativeType',
  'datasetUrl',
  'defaultPriority',
  'defaultZoom',
  'enabled',
  'exportableProperties',
  'featured',
  'highPriorityBounds',
  'highPriorityRule',
  'limitReviewTags',
  'lowPriorityBounds',
  'lowPriorityRule',
  'maxZoom',
  'mediumPriorityBounds',
  'mediumPriorityRule',
  'minZoom',
  'overpassTargetType',
  'paused',
  'preferredReviewTags',
  'presets',
  'requireConfirmation',
  'requireRejectReason',
  'requiresLocal',
  'reviewSetting',
  'taskStyles',
  'taskWidgetLayout',
  'updateTasks',
] as const

export const commentOutClonedOverpassQuery = (overpassQL: string) =>
  `/*\nTHIS IS THE QUERY OF THE CHALLENGE YOU CLONED PLEASE ADAPT BEFORE USING TO AVOID CREATING DUPLICATE TASKS\n\n${overpassQL}\n*/`

export const buildCloneFormValues = (
  source: Challenge,
  projectId: number | undefined
): ChallengeFormValues => {
  const values = buildFormValues(source, source.parent ?? 0)
  return {
    ...values,
    projectId: projectId ?? values.projectId,
    name: '',
    overpassQL: source.overpassQL ? commentOutClonedOverpassQuery(source.overpassQL) : '',
    remoteGeoJSON: '',
    dataOriginDate: '',
    localGeoJSON: null,
    automatedEditsCodeAgreement: false,
  }
}

export const clonedChallengeSettings = (source: Challenge): Record<string, unknown> => {
  const record = source as unknown as Record<string, unknown>
  const settings: Record<string, unknown> = {}
  for (const key of CLONED_SETTINGS) {
    if (record[key] !== undefined && record[key] !== null) settings[key] = record[key]
  }
  if (source.overpassQL && !settings.overpassTargetType) {
    settings.overpassTargetType = 'none'
  }
  return settings
}
