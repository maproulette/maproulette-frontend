import { basemapSubmission } from '@/components/Map/basemap'
import type { ChallengeFormValues } from '@/components/Pages/ManagementPages/ManageChallengeNew/ChallengeForm'
import { detectLocalGeoJSONSubmission } from '@/lib/localGeoJSON'
import { bundledGeoJSONFile } from '@/lib/taskBundling'
import type { Challenge } from '@/types/Challenge'

export type LocalGeoJSONUpload = {
  file: File
  lineByLine: boolean
  dataOriginDate?: string
}

const BUNDLED_UPLOAD_FILENAME = 'bundled-tasks.geojson'

const fetchRemoteGeoJSON = async (url: string) => {
  let response: Response
  try {
    response = await fetch(url)
  } catch (error) {
    throw new Error(
      `Could not download GeoJSON from ${url} to group its features. The server must allow cross-origin requests from MapRoulette, or the file can be uploaded directly instead. (${String(error)})`
    )
  }

  if (!response.ok) {
    throw new Error(
      `Could not download GeoJSON from ${url} to group its features (HTTP ${response.status}).`
    )
  }

  return response.text()
}

export const buildChallengeSubmission = async (values: ChallengeFormValues, isCreate: boolean) => {
  const challengeData: Partial<Challenge> & Record<string, unknown> = {
    name: values.name,
    description: isCreate ? values.description || '' : values.description || undefined,
    instruction: isCreate ? values.instruction || '' : values.instruction || undefined,
    difficulty: values.difficulty,
  }
  let localGeoJSONUpload: LocalGeoJSONUpload | undefined

  // Always sent, including as an explicit null: the backend treats a missing
  // key as "leave ownership alone", so omitting it would make handing a
  // challenge back from a team impossible.
  challengeData.ownerTeamId = values.ownerTeamId ?? null

  // These are editable at any time, so they are assembled before the update
  // short-circuit below.
  challengeData.osmIdProperty = values.osmIdProperty || null
  challengeData.preferredTags = values.preferredTags || null
  challengeData.limitTags = values.limitTags
  Object.assign(challengeData, basemapSubmission(values.basemap, values.basemapUrl ?? ''))

  const bundleIdProperty = values.taskBundleIdProperty?.trim() ?? ''
  challengeData.taskBundleIdProperty = bundleIdProperty || null

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
    if (bundleIdProperty) {
      localGeoJSONUpload = {
        file: bundledGeoJSONFile(
          await fetchRemoteGeoJSON(values.remoteGeoJSON),
          bundleIdProperty,
          BUNDLED_UPLOAD_FILENAME
        ),
        lineByLine: true,
        dataOriginDate: values.dataOriginDate || undefined,
      }
    } else {
      challengeData.remoteGeoJson = values.remoteGeoJSON
    }
  }

  if (values.dataSource === 'localGeoJSON' && values.localGeoJSON) {
    if (bundleIdProperty) {
      localGeoJSONUpload = {
        file: bundledGeoJSONFile(
          await values.localGeoJSON.text(),
          bundleIdProperty,
          BUNDLED_UPLOAD_FILENAME
        ),
        lineByLine: true,
        dataOriginDate: values.dataOriginDate || undefined,
      }
    } else {
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
  }

  return { challengeData, localGeoJSONUpload }
}
