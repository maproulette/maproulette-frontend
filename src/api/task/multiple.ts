import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { TaskPropertySearch } from '@/components/shared/TaskPropertyQueryBuilder/taskPropertySearch'
import type { TaskGetResponse, TasksBoundingBoxResponse } from '@/types/Task'
import { apiRequest, convertParamsToSearchParams } from '../client'

// Ceiling on how many property matches are pulled back for the explorer's
// filter. Well above a typical challenge; a larger one filters down to the
// first this many matches rather than refusing to filter at all.
const PROPERTY_MATCH_LIMIT = 10000

// Tasks sampled when collecting the property names to suggest. Big enough to
// cover a challenge's schema, small enough to stay cheap.
const PROPERTY_KEY_SAMPLE_SIZE = 100

export const tasksOptions = (taskIds: number[]) =>
  queryOptions({
    queryKey: ['task', 'batch', [...taskIds].sort((a, b) => a - b)],
    queryFn: () =>
      apiRequest
        .get('api/v2/tasks', {
          searchParams: {
            taskIds: taskIds.join(','),
            mapillary: 'false',
          },
        })
        .json<TaskGetResponse[]>(),
    enabled: taskIds.length > 0,
  })

/**
 * Ids of a challenge's tasks whose feature properties match `taskPropertySearch`.
 *
 * The properties themselves only exist server-side — task markers carry just
 * id, status and priority — so a property filter has to be resolved by the
 * backend and then intersected with the markers the explorer already holds.
 * The world bounding box is used because the filter is meant to apply to the
 * whole challenge rather than whatever the map happens to be showing.
 */
export const taskIdsMatchingPropertiesOptions = (
  challengeId: number,
  taskPropertySearch: TaskPropertySearch | null
) =>
  queryOptions({
    queryKey: ['task', 'propertyMatches', challengeId, taskPropertySearch],
    queryFn: async ({ signal }) => {
      const response = await apiRequest
        .put('api/v2/tasks/box/-180/-85/180/85', {
          searchParams: convertParamsToSearchParams({
            cid: challengeId,
            limit: PROPERTY_MATCH_LIMIT,
            page: 0,
            includeTotal: true,
            includeGeometries: false,
            includeTags: false,
          }),
          json: { taskPropertySearch },
          signal,
        })
        .json<TasksBoundingBoxResponse>()
      return new Set(response.tasks.map((task) => task.id))
    },
    placeholderData: keepPreviousData,
    enabled: !!taskPropertySearch,
  })

/**
 * Feature-property names in use on a challenge's tasks, for suggesting them
 * in the property filter.
 *
 * MapRoulette 3 read these from a dedicated backend route, which the current
 * API does not have, so they are collected from a sample of the challenge's
 * tasks instead. A sample is enough to offer as suggestions — the filter
 * still accepts any name typed by hand.
 */
export const challengePropertyKeysOptions = (challengeId: number) =>
  queryOptions({
    queryKey: ['task', 'propertyKeys', challengeId],
    queryFn: async ({ signal }) => {
      const response = await apiRequest
        .put('api/v2/tasks/box/-180/-85/180/85', {
          searchParams: convertParamsToSearchParams({
            cid: challengeId,
            limit: PROPERTY_KEY_SAMPLE_SIZE,
            page: 0,
            includeGeometries: true,
            includeTags: false,
          }),
          json: {},
          signal,
        })
        .json<TasksBoundingBoxResponse>()

      const keys = new Set<string>()
      for (const task of response.tasks ?? []) {
        for (const feature of task.geometries?.features ?? []) {
          for (const key of Object.keys(feature.properties ?? {})) keys.add(key)
        }
      }
      return [...keys].sort((a, b) => a.localeCompare(b))
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!challengeId,
  })
