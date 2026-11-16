import { useMutation } from '@tanstack/react-query'
import type { TaskPropertySearch } from '@/components/shared/TaskPropertyQueryBuilder/taskPropertySearch'
import { apiRequest, convertParamsToSearchParams } from '../client'

export type ExportFormat = 'csv' | 'geojson'

export interface ChallengeExportOptions {
  challengeId: number
  challengeName?: string | null
  format: ExportFormat
  /** `+HH:MM` offset applied to timestamp columns; blank means the server default (GMT). */
  timezone?: string
  taskStatuses?: number[]
  priorities?: number[]
  reviewStatuses?: number[]
  taskPropertySearch?: TaskPropertySearch | null
}

/** Filename-safe version of a challenge's name, for the downloaded file. */
const exportFilename = (options: ChallengeExportOptions): string => {
  const base = (options.challengeName ?? `challenge-${options.challengeId}`)
    .trim()
    .replace(/[^\w\-. ]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return `${base || `challenge-${options.challengeId}`}.${options.format === 'csv' ? 'csv' : 'geojson'}`
}

/**
 * Hand the browser a blob to save. The export endpoints need the app's
 * credentials, so the file is fetched rather than linked to directly.
 */
const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const challengeExports = {
  /**
   * Download one challenge's tasks as CSV or GeoJSON, honouring the filters
   * currently applied to the task table. A property filter is a nested rule
   * tree, so it travels in the body and the POST form of each endpoint is used.
   */
  useExportChallenge: () =>
    useMutation({
      mutationFn: async (options: ChallengeExportOptions) => {
        const searchParams = convertParamsToSearchParams({
          ...(options.taskStatuses?.length ? { status: options.taskStatuses.join(',') } : {}),
          ...(options.priorities?.length ? { priority: options.priorities.join(',') } : {}),
          ...(options.reviewStatuses?.length
            ? { reviewStatus: options.reviewStatuses.join(',') }
            : {}),
          ...(options.timezone ? { timezone: options.timezone } : {}),
        })

        const path =
          options.format === 'csv'
            ? `api/v2/challenge/${options.challengeId}/tasks/extract`
            : `api/v2/challenge/view/${options.challengeId}`

        const blob = await apiRequest
          .post(path, {
            searchParams,
            json: options.taskPropertySearch
              ? { taskPropertySearch: options.taskPropertySearch }
              : {},
          })
          .blob()

        saveBlob(blob, exportFilename(options))
      },
    }),
}

export const __testing = { exportFilename }
