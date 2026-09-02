import { keepPreviousData, queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TaskPropertySearch } from '@/components/shared/TaskPropertyQueryBuilder/taskPropertySearch'
import { metaReviewStatusesForApi } from '@/lib/challengeTaskTableSearch'
import type {
  TaskGetResponse,
  TaskMarkersParams,
  TaskMarkersResponse,
  TasksBoundingBoxQuery,
  TasksBoundingBoxResponse,
  TasksInBoundsParams,
  TasksInBoundsResponse,
} from '@/types/Task'
import { apiRequest, convertParamsToSearchParams } from '../client'

// Ceiling on how many property matches are pulled back for the explorer's
// filter. Well above a typical challenge; a larger one filters down to the
// first this many matches rather than refusing to filter at all.
const PROPERTY_MATCH_LIMIT = 10000

// Tasks sampled when collecting the property names to suggest. Big enough to
// cover a challenge's schema, small enough to stay cheap.
const PROPERTY_KEY_SAMPLE_SIZE = 100

const tasksBoundingBoxSearchParams = (query: TasksBoundingBoxQuery) => {
  const mr = metaReviewStatusesForApi(query.reviewStatuses, query.metaReviewStatuses)
  return convertParamsToSearchParams({
    limit: query.limit,
    page: query.page,
    sort: query.sort,
    order: query.order,
    includeTotal: true,
    excludeLocked: true,
    includeGeometries: false,
    includeTags: false,
    cid: query.challengeId,
    ca: true,
    tStatus: query.taskStatuses.join(','),
    priorities: query.priorities.join(','),
    trStatus: query.reviewStatuses.join(','),
    mrStatus: mr.join(','),
  })
}

export const taskMultiple = {
  getTasks: (taskIds: number[]) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['task', 'batch', [...taskIds].sort((a, b) => a - b)],
        queryFn: async () => {
          const cachedTasks: TaskGetResponse[] = []
          const missingIds: number[] = []

          for (const id of taskIds) {
            const cached = queryClient.getQueryData<TaskGetResponse>(['task', id])
            if (cached) {
              cachedTasks.push(cached)
            } else {
              missingIds.push(id)
            }
          }

          if (missingIds.length === 0) {
            return cachedTasks
          }

          const fetched = await apiRequest
            .get('api/v2/tasks', {
              searchParams: {
                taskIds: missingIds.join(','),
                mapillary: 'false',
              },
            })
            .json<TaskGetResponse[]>()

          for (const task of fetched) {
            queryClient.setQueryData(['task', task.id], task)
          }

          return [...cachedTasks, ...fetched]
        },
        enabled: taskIds.length > 0,
      })
    )
  },

  getTaskMarkers: (params: TaskMarkersParams) =>
    useQuery(
      queryOptions({
        queryKey: ['task', 'markers', params],
        queryFn: ({ signal }) =>
          apiRequest
            .get(`api/v2/taskMarkers`, {
              searchParams: params ? convertParamsToSearchParams(params) : undefined,
              signal,
            })
            .json<TaskMarkersResponse>(),
        placeholderData: keepPreviousData,
      })
    ),

  getTasksInBounds: (params: TasksInBoundsParams, options?: { enabled?: boolean }) =>
    useQuery(
      queryOptions({
        queryKey: ['task', 'inBounds', params],
        queryFn: ({ signal }) =>
          apiRequest
            .get('api/v2/tasks/bounds', {
              searchParams: convertParamsToSearchParams({ ...params }),
              signal,
            })
            .json<TasksInBoundsResponse>(),
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
      })
    ),

  /**
   * Ids of a challenge's tasks whose feature properties match `taskPropertySearch`.
   *
   * The properties themselves only exist server-side — task markers carry just
   * id, status and priority — so a property filter has to be resolved by the
   * backend and then intersected with the markers the explorer already holds.
   * The world bounding box is used because the filter is meant to apply to the
   * whole challenge rather than whatever the map happens to be showing.
   */
  getTaskIdsMatchingProperties: (
    challengeId: number,
    taskPropertySearch: TaskPropertySearch | null,
    options?: { enabled?: boolean }
  ) =>
    useQuery(
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
        enabled: (options?.enabled ?? true) && !!taskPropertySearch,
      })
    ),

  /**
   * Feature-property names in use on a challenge's tasks, for suggesting them
   * in the property filter.
   *
   * MapRoulette 3 read these from a dedicated backend route, which the current
   * API does not have, so they are collected from a sample of the challenge's
   * tasks instead. A sample is enough to offer as suggestions — the filter
   * still accepts any name typed by hand.
   */
  getChallengePropertyKeys: (challengeId: number, options?: { enabled?: boolean }) =>
    useQuery(
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
        enabled: (options?.enabled ?? true) && !!challengeId,
      })
    ),

  /** Paginated tasks in a box with the same filter/sort query params as maproulette3 (PUT tasks/box/...). */
  getTasksInBoundingBox: (query: TasksBoundingBoxQuery, options?: { enabled?: boolean }) =>
    useQuery(
      queryOptions({
        queryKey: ['task', 'inBoundingBox', query],
        queryFn: ({ signal }) =>
          apiRequest
            .put(`api/v2/tasks/box/${query.left}/${query.bottom}/${query.right}/${query.top}`, {
              searchParams: tasksBoundingBoxSearchParams(query),
              // The property filter is a nested rule tree, so it travels in the
              // body; an empty object means "no property filter".
              json: query.taskPropertySearch
                ? { taskPropertySearch: query.taskPropertySearch }
                : {},
              signal,
            })
            .json<TasksBoundingBoxResponse>(),
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
      })
    ),
}
