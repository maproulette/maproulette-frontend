import type { ChallengeFormValues } from '@/components/Pages/ManagementPages/ManageChallengeNew/ChallengeForm'
import { detectLocalGeoJSONSubmission } from '@/lib/localGeoJSON'
import type { Challenge } from '@/types/Challenge'

export type LocalGeoJSONUpload = {
  file: File
  lineByLine: boolean
  dataOriginDate?: string
}

export const buildChallengeSubmission = async (values: ChallengeFormValues, isCreate: boolean) => {
  const challengeData: Partial<Challenge> & Record<string, unknown> = {
    name: values.name,
    description: isCreate ? values.description || '' : values.description || undefined,
    instruction: isCreate ? values.instruction || '' : values.instruction || undefined,
    difficulty: values.difficulty,
  }
  let localGeoJSONUpload: LocalGeoJSONUpload | undefined

  // The data source is only set at creation. Editing a challenge changes
  // metadata only — regenerating tasks from a new/updated source is done via
  // Rebuild Tasks — so the source fields are deliberately omitted on update to
  // avoid disturbing existing tasks.
  if (!isCreate) {
    return { challengeData, localGeoJSONUpload }
  }

  if (values.dataSource === 'overpass') {
    challengeData.overpassQL = values.overpassQL || ''
  } else {
    challengeData.overpassQL = ''
  }

  if (values.dataSource === 'remoteGeoJSON' && values.remoteGeoJSON) {
    challengeData.remoteGeoJson = values.remoteGeoJSON
  }

  if (values.dataSource === 'localGeoJSON' && values.localGeoJSON) {
    const submission = await detectLocalGeoJSONSubmission(values.localGeoJSON)

    if (submission.kind === 'lineByLine') {
      localGeoJSONUpload = {
        file: submission.file,
        lineByLine: true,
        dataOriginDate: values.dataOriginDate || undefined,
      }
    } else {
      challengeData.localGeoJSON = submission.geoJSON
      if (values.dataOriginDate) {
        ;(challengeData as Record<string, unknown>).dataOriginDate = values.dataOriginDate
      }
    }
  }

  return { challengeData, localGeoJSONUpload }
}
