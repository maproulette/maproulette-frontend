import {
  type QueryClient,
  type QueryKey,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { withScalarParent } from '@/lib/challengeParent'
import type {
  Challenge,
  ChallengeActivityEntry,
  ChallengeGetResponse,
  ChallengeStatsResponse,
  ChallengeTaskMarkersResponse,
} from '@/types/Challenge'
import type { Task } from '@/types/Task'
import { apiRequest } from '../client'

/**
 * Surgically update a single task's entry in the cached `taskMarkers` list for
 * a challenge. Avoids refetching the whole marker set (which can hold thousands
 * of points) when only one task's status / lock / bundle changed. No-op if the
 * list isn't cached or the task isn't in it.
 */
export const patchChallengeTaskMarker = (
  queryClient: QueryClient,
  challengeId: number,
  taskId: number,
  patch: Partial<{
    status: number
    priority: number
    bundleId: number | null
    lockedBy: number | null
  }>
) => {
  if (!challengeId) return
  queryClient.setQueryData<ChallengeTaskMarkersResponse>(
    ['challenge', 'taskMarkers', challengeId],
    (old) => {
      if (!old?.markers) return old
      let changed = false
      const markers = old.markers.map((m) => {
        if (m.id !== taskId) return m
        changed = true
        return { ...m, ...patch }
      })
      return changed ? { ...old, markers } : old
    }
  )
}

/**
 * Query keys whose cached payload holds whole challenge records — a single
 * challenge, an array of them, or an infinite-query page set. Aggregate caches
 * (`stats`, `activity`, `tags`, `isFavorited`, ...) are deliberately excluded:
 * they carry `id` fields of their own and must not absorb challenge patches.
 */
const CHALLENGE_LIST_KEYS = new Set([
  'listing',
  'explore',
  'exploreInfinite',
  'featured',
  'preferred',
  'search',
])

const holdsChallengeRecords = (queryKey: readonly unknown[]) => {
  if (queryKey[0] === 'project' && queryKey[1] === 'challenges') return true
  if (queryKey[0] !== 'challenge') return false
  if (queryKey.length === 2 && typeof queryKey[1] === 'number') return true
  return typeof queryKey[1] === 'string' && CHALLENGE_LIST_KEYS.has(queryKey[1])
}

/**
 * Merge `patch` into the matching challenge wherever it sits in a cached
 * payload. Returns the original reference untouched when nothing matched, so
 * callers can skip writing (and snapshotting) unaffected queries.
 */
const patchCachedChallenges = (
  data: unknown,
  challengeId: number,
  patch: Record<string, unknown>
): unknown => {
  if (Array.isArray(data)) {
    let changed = false
    const next = data.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry
      if ((entry as { id?: number }).id !== challengeId) return entry
      changed = true
      return { ...entry, ...patch }
    })
    return changed ? next : data
  }

  if (data && typeof data === 'object') {
    const record = data as { id?: number; pages?: unknown[] }
    if (Array.isArray(record.pages)) {
      let changed = false
      const pages = record.pages.map((page) => {
        const nextPage = patchCachedChallenges(page, challengeId, patch)
        if (nextPage !== page) changed = true
        return nextPage
      })
      return changed ? { ...record, pages } : data
    }
    if (record.id === challengeId) return { ...record, ...patch }
  }

  return data
}

/**
 * Optimistically apply a challenge change to every cache that already holds
 * that challenge, so card toggles (pause, archive, discoverable) repaint on
 * click instead of after the round trip plus the listing refetch that follows
 * it. Returns a rollback that restores the pre-patch snapshots — call it from
 * the mutation's `onError` so a failed write doesn't leave a lie on screen.
 */
export const patchChallengeInCaches = (
  queryClient: QueryClient,
  challengeId: number,
  patch: Partial<Challenge> | Record<string, unknown>
) => {
  if (!challengeId) return () => {}

  const snapshots: Array<[QueryKey, unknown]> = []
  for (const query of queryClient.getQueryCache().findAll()) {
    if (!holdsChallengeRecords(query.queryKey)) continue
    const current = query.state.data
    const next = patchCachedChallenges(current, challengeId, patch as Record<string, unknown>)
    if (next === current) continue
    snapshots.push([query.queryKey, current])
    queryClient.setQueryData(query.queryKey, next)
  }

  return () => {
    for (const [queryKey, data] of snapshots) {
      queryClient.setQueryData(queryKey, data)
    }
  }
}

/**
 * Invalidate the per-challenge aggregate caches that depend on task counts
 * (stats, activity, completionMetrics on challenge). Call only when a task's
 * status actually changed — lock/unlock and comment-only events leave counts
 * untouched and shouldn't pay the refetch cost.
 */
export const invalidateChallengeAggregates = (queryClient: QueryClient, challengeId: number) => {
  if (!challengeId) return
  void queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] })
  void queryClient.invalidateQueries({ queryKey: ['challenge', 'stats', challengeId] })
  void queryClient.invalidateQueries({ queryKey: ['challenge', 'activity', challengeId] })
}

/**
 * Seed the single-challenge cache (`['challenge', id]`) from a listing payload.
 *
 * Listing endpoints that run the backend's `ParentMixin.insertProjectJSON`
 * (`exploreChallenges`, `extendedFind`, ...) replace a challenge's scalar
 * `parent` with the full project object. `GET /challenge/{id}` returns the id,
 * and so does everything reading this cache key — including the challenge route
 * loader, which serves it to callers that fetch the parent project. Collapse
 * `parent` back to the id before seeding; otherwise those callers request
 * `api/v2/project/[object Object]`.
 */
export const seedChallengeCache = <T extends { id?: number; parent?: unknown }>(
  queryClient: QueryClient,
  challenges: T[]
) => {
  for (const challenge of challenges) {
    if (!challenge?.id) continue
    queryClient.setQueryData(['challenge', challenge.id], withScalarParent(challenge))
  }
}

export const challengeSingle = {
  getChallenge: (challengeId: number) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', challengeId],
        queryFn: () =>
          apiRequest.get(`api/v2/challenge/${challengeId}`).json<ChallengeGetResponse>(),
        enabled: !!challengeId,
      })
    ),

  getChallengeOptions: (challengeId: number) =>
    queryOptions({
      queryKey: ['challenge', challengeId],
      queryFn: () => apiRequest.get(`api/v2/challenge/${challengeId}`).json<ChallengeGetResponse>(),
    }),

  getChallengeTags: (challengeId: number) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', 'tags', challengeId],
        queryFn: () =>
          apiRequest
            .get(`api/v2/challenge/${challengeId}/tags`)
            .json<Array<{ id: number; name: string }>>(),
        enabled: !!challengeId,
        staleTime: 5 * 60 * 1000,
      })
    ),

  /**
   * Fetches tags for many challenges in a single request instead of one request
   * per challenge id. Reuses/backfills the per-challenge `getChallengeTags` cache
   * entries so single-challenge lookups can hit cache too.
   */
  getChallengeTagsBatch: (challengeIds: number[]) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['challenge', 'tags', 'batch', [...challengeIds].sort((a, b) => a - b)],
        queryFn: async () => {
          const result = new Map<number, Array<{ id: number; name: string }>>()
          const missingIds: number[] = []

          for (const id of challengeIds) {
            const cached = queryClient.getQueryData<Array<{ id: number; name: string }>>([
              'challenge',
              'tags',
              id,
            ])
            if (cached) {
              result.set(id, cached)
            } else {
              missingIds.push(id)
            }
          }

          if (missingIds.length === 0) {
            return result
          }

          const fetched = await apiRequest
            .get('api/v2/challenges/tags/batch', {
              searchParams: { challengeIds: missingIds.join(',') },
            })
            .json<Record<string, Array<{ id: number; name: string }>>>()

          for (const id of missingIds) {
            const tags = fetched[String(id)] ?? []
            queryClient.setQueryData(['challenge', 'tags', id], tags)
            result.set(id, tags)
          }

          return result
        },
        staleTime: 5 * 60 * 1000,
        enabled: challengeIds.length > 0,
      })
    )
  },

  getChallengeStats: (challengeId: number, enabled = true) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', 'stats', challengeId],
        queryFn: async () =>
          apiRequest.get(`api/v2/data/challenge/${challengeId}`).json<ChallengeStatsResponse>(),
        enabled: !!challengeId && enabled,
      })
    ),

  getChallengeActivity: (challengeId: number) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', 'activity', challengeId],
        queryFn: ({ signal }) =>
          apiRequest
            .get(`api/v2/data/challenge/${challengeId}/activity`, { signal })
            .json<ChallengeActivityEntry[]>(),
        enabled: !!challengeId,
      })
    ),

  // Shared so the route loader can prefetch the (often large, slow) task-marker
  // set without blocking navigation, while the map reads the same query.
  getChallengeTaskMarkersOptions: (challengeId: number) =>
    queryOptions({
      queryKey: ['challenge', 'taskMarkers', challengeId],
      queryFn: () =>
        apiRequest
          .get(`api/v2/challenge/${challengeId}/taskMarkers`)
          .json<ChallengeTaskMarkersResponse>(),
      enabled: !!challengeId,
    }),

  getChallengeTaskMarkers: (challengeId: number) =>
    useQuery(challengeSingle.getChallengeTaskMarkersOptions(challengeId)),

  getRandomTask: async (challengeId: number, queryClient: QueryClient) => {
    const tasks = await apiRequest
      .get(`api/v2/challenge/${challengeId}/tasks/random`, { searchParams: { limit: 1 } })
      .json<Task[]>()
    for (const task of tasks) {
      queryClient.setQueryData(['task', task.id], task)
    }
    return tasks
  },

  // Any task in the challenge, regardless of status - used to drop into read-only
  // browsing when the challenge has no startable tasks left.
  getFirstTask: async (challengeId: number, queryClient: QueryClient) => {
    const tasks = await apiRequest
      .get(`api/v2/challenge/${challengeId}/tasks`, { searchParams: { limit: 1, page: 0 } })
      .json<Task[]>()
    for (const task of tasks) {
      queryClient.setQueryData(['task', task.id], task)
    }
    return tasks
  },

  fetchTasksNearby: async (challengeId: number, taskId: number, limit = 5) => {
    const tasks = await apiRequest
      .get(`api/v2/challenge/${challengeId}/tasksNearby/${taskId}`, {
        searchParams: { excludeSelfLocked: 'true', limit: String(limit) },
      })
      .json<Task[]>()
    return tasks
  },

  getTasksNearby: (challengeId: number, taskId: number, limit = 5) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['challenge', 'tasksNearby', challengeId, { taskId, limit }],
        queryFn: async () => {
          const tasks = await apiRequest
            .get(`api/v2/challenge/${challengeId}/tasksNearby/${taskId}`, {
              searchParams: { excludeSelfLocked: 'true', limit: String(limit) },
            })
            .json<Task[]>()
          for (const task of tasks) {
            queryClient.setQueryData(['task', task.id], task)
          }
          return tasks
        },
        enabled: !!challengeId && !!taskId,
      })
    )
  },

  // Mutation hook
  useCloneChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      // `projectId` is optional; the backend clones into the original challenge's
      // project when it is omitted.
      mutationFn: ({
        challengeId,
        newName,
        projectId,
      }: {
        challengeId: number
        newName: string
        projectId?: number
      }) =>
        apiRequest
          .put(`api/v2/challenge/${challengeId}/clone/${encodeURIComponent(newName)}`, {
            ...(projectId != null && { searchParams: { projectId } }),
          })
          .json<ChallengeGetResponse>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'managed'] })
        queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
      },
    })
  },

  useCreateChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        projectId,
        challengeData,
      }: {
        projectId: number
        challengeData: Partial<Challenge>
      }) => {
        const { id: _, ...challengeDataWithoutId } = challengeData
        const body: Record<string, unknown> = {
          parent: projectId,
          name: challengeDataWithoutId.name || '',
          description: challengeDataWithoutId.description || '',
          instruction: challengeDataWithoutId.instruction || '',
          difficulty: challengeDataWithoutId.difficulty ?? 2,
          enabled: challengeDataWithoutId.enabled ?? true,
          featured: challengeDataWithoutId.featured ?? false,
          overpassQL: challengeDataWithoutId.overpassQL || '',
          overpassTargetType: '',
        }
        const extra = challengeDataWithoutId as Record<string, unknown>
        if (extra.defaultBasemap !== undefined) body.defaultBasemap = extra.defaultBasemap
        if (extra.defaultBasemapId !== undefined) body.defaultBasemapId = extra.defaultBasemapId
        if (extra.customBasemap !== undefined) body.customBasemap = extra.customBasemap
        if (extra.localGeoJSON !== undefined) body.localGeoJSON = extra.localGeoJSON
        if (extra.dataOriginDate !== undefined) body.dataOriginDate = extra.dataOriginDate

        return apiRequest.post('api/v2/challenge', { json: body }).json<Challenge>()
      },
      onSuccess: (newChallenge, variables) => {
        // Set the new challenge in cache
        queryClient.setQueryData<Challenge>(['challenge', newChallenge.id], newChallenge)
        // Invalidate project challenges list
        queryClient.invalidateQueries({ queryKey: ['project', 'challenges', variables.projectId] })
      },
    })
  },

  useUpdateChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        challengeId,
        updates,
      }: {
        challengeId: number
        updates: Partial<Challenge>
      }) =>
        apiRequest
          .put(`api/v2/challenge/${challengeId}`, {
            json: {
              id: challengeId,
              ...updates,
            },
          })
          .json<Challenge>(),
      // Repaint the edited fields everywhere the challenge is cached before the
      // request goes out; the invalidations below reconcile with the server.
      onMutate: ({ challengeId, updates }) => ({
        rollback: patchChallengeInCaches(queryClient, challengeId, updates),
      }),
      onError: (_error, _variables, context) => context?.rollback(),
      onSuccess: (updatedChallenge) => {
        queryClient.setQueryData<ChallengeGetResponse>(
          ['challenge', updatedChallenge.id],
          updatedChallenge
        )
        void queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
        void queryClient.invalidateQueries({ queryKey: ['challenge', 'listing'] })
        void queryClient.invalidateQueries({ queryKey: ['challenge', 'explore'] })
        void queryClient.invalidateQueries({ queryKey: ['challenge', 'exploreInfinite'] })
      },
    })
  },

  useSaveOrUpdateChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (challenge: Partial<Challenge>) =>
        apiRequest.post('api/v2/challenge/saveOrUpdate', { json: challenge }).json<Challenge>(),
      onSuccess: (saved) => {
        queryClient.setQueryData<ChallengeGetResponse>(['challenge', saved.id], saved)
        void queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
        void queryClient.invalidateQueries({ queryKey: ['challenge', 'listing'] })
        void queryClient.invalidateQueries({ queryKey: ['challenge', 'explore'] })
        void queryClient.invalidateQueries({ queryKey: ['challenge', 'exploreInfinite'] })
      },
    })
  },

  useUpdatePriorities: () => {
    const queryClient = useQueryClient()
    return useMutation({
      // The body must always include every priority key, even when a tier's
      // rule or bounds have been cleared. Empty strings tell the backend
      // "unset this field"; omitting them makes the DAL fall back to the
      // cached value and persist stale config the user thought they deleted.
      mutationFn: ({
        challengeId,
        priorities,
      }: {
        challengeId: number
        priorities: {
          defaultPriority: number
          highPriorityRule: string
          highPriorityBounds: string
          mediumPriorityRule: string
          mediumPriorityBounds: string
          lowPriorityRule: string
          lowPriorityBounds: string
        }
      }) =>
        apiRequest
          .put(`api/v2/challenge/${challengeId}/priorities`, { json: priorities })
          .json<Challenge>(),
      onSuccess: (updated, variables) => {
        queryClient.setQueryData<ChallengeGetResponse>(['challenge', updated.id], updated)
        // Backend re-evaluates every task's priority; force a refetch so the
        // map markers and any per-task views show the new tier values.
        void queryClient.invalidateQueries({
          queryKey: ['challenge', 'taskMarkers', variables.challengeId],
        })
        void queryClient.invalidateQueries({ queryKey: ['task'] })
      },
    })
  },

  /**
   * Dry-run priority recompute. Takes the same body as `useUpdatePriorities`
   * and returns the priority each task would receive, without writing. The
   * editor calls this (debounced) so the preview map and match counts match
   * what a subsequent save would actually persist — client-side `evaluatePriority`
   * can't evaluate rule-based tiers since the frontend doesn't load OSM tags.
   */
  usePreviewPriorities: (
    challengeId: number,
    draft: {
      defaultPriority: number
      highPriorityRule: string
      highPriorityBounds: string
      mediumPriorityRule: string
      mediumPriorityBounds: string
      lowPriorityRule: string
      lowPriorityBounds: string
    } | null
  ) =>
    useQuery({
      // Include the draft in the key so React Query dedupes identical drafts
      // and fetches anew when the user actually edits — no manual debounce
      // state plumbing needed on the caller side.
      queryKey: ['challenge', 'priorities', 'preview', challengeId, draft],
      queryFn: () =>
        apiRequest
          .post(`api/v2/challenge/${challengeId}/priorities/preview`, {
            json: draft ?? {},
          })
          .json<{
            priorities: Record<string, number>
            counts: { high: number; medium: number; low: number }
          }>(),
      enabled: Number.isFinite(challengeId) && challengeId > 0 && draft != null,
      // Keep the previous result rendered while a new preview is in flight,
      // so pins don't flicker to default between keystrokes.
      placeholderData: (prev) => prev,
      staleTime: 0,
    }),

  useUploadGeoJSON: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        challengeId,
        geoJSONFile,
        options,
      }: {
        challengeId: number
        geoJSONFile: File
        options?: {
          lineByLine?: boolean
          removeUnmatched?: boolean
          dataOriginDate?: string
          skipSnapshot?: boolean
        }
      }) => {
        const searchParams: Record<string, string> = {
          lineByLine: String(options?.lineByLine ?? false),
          removeUnmatched: String(options?.removeUnmatched ?? false),
          skipSnapshot: String(options?.skipSnapshot ?? true),
        }
        if (options?.dataOriginDate) {
          searchParams.dataOriginDate = options.dataOriginDate
        }

        const formData = new FormData()
        formData.append('json', geoJSONFile)

        return apiRequest
          .put(`api/v2/challenge/${challengeId}/addFileTasks`, {
            body: formData,
            searchParams,
          })
          .json<void>()
      },
      onSuccess: (_data, variables) => {
        // Invalidate challenge task markers since tasks changed
        queryClient.invalidateQueries({
          queryKey: ['challenge', 'taskMarkers', variables.challengeId],
        })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'stats', variables.challengeId] })
      },
    })
  },

  refreshChallenge: async (challengeId: number, queryClient: QueryClient) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] }),
      queryClient.invalidateQueries({ queryKey: ['challenge', 'taskMarkers', challengeId] }),
      queryClient.invalidateQueries({ queryKey: ['challenge', 'stats', challengeId] }),
      queryClient.invalidateQueries({ queryKey: ['challenge', 'activity', challengeId] }),
    ])
  },

  useMoveChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ challengeId, toProjectId }: { challengeId: number; toProjectId: number }) =>
        apiRequest.post(`api/v2/challenge/${challengeId}/project/${toProjectId}`).json<void>(),
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['challenge', variables.challengeId] })
        queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
      },
    })
  },

  useDeleteChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (challengeId: number) =>
        apiRequest.delete(`api/v2/challenge/${challengeId}`).then(() => ({ challengeId })),
      onSuccess: (_, challengeId) => {
        queryClient.removeQueries({ queryKey: ['challenge', challengeId] })
        queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'listing'] })
      },
    })
  },

  useArchiveChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ challengeId, isArchived }: { challengeId: number; isArchived: boolean }) =>
        apiRequest
          .post(`api/v2/challenge/${challengeId}/archive`, {
            json: { isArchived },
          })
          .json<void>(),
      onMutate: ({ challengeId, isArchived }) => ({
        rollback: patchChallengeInCaches(queryClient, challengeId, { isArchived }),
      }),
      onError: (_error, _variables, context) => context?.rollback(),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['challenge', variables.challengeId] })
        queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'listing'] })
      },
    })
  },

  usePauseChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ challengeId, paused }: { challengeId: number; paused: boolean }) =>
        apiRequest
          .put(`api/v2/challenge/${challengeId}`, {
            json: { id: challengeId, paused },
          })
          .json<Challenge>(),
      onMutate: ({ challengeId, paused }) => ({
        rollback: patchChallengeInCaches(queryClient, challengeId, { paused }),
      }),
      onError: (_error, _variables, context) => context?.rollback(),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['challenge', variables.challengeId] })
        queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'listing'] })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'explore'] })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'exploreInfinite'] })
      },
    })
  },

  useRebuildChallenge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        challengeId,
        removeUnmatched,
        skipSnapshot,
      }: {
        challengeId: number
        removeUnmatched?: boolean
        skipSnapshot?: boolean
      }) => {
        const searchParams: Record<string, string> = {}
        if (removeUnmatched !== undefined) searchParams.removeUnmatched = String(removeUnmatched)
        if (skipSnapshot !== undefined) searchParams.skipSnapshot = String(skipSnapshot)
        return apiRequest
          .put(`api/v2/challenge/${challengeId}/rebuild`, { searchParams })
          .json<void>()
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['challenge', variables.challengeId] })
        queryClient.invalidateQueries({ queryKey: ['project', 'challenges'] })
        queryClient.invalidateQueries({ queryKey: ['challenge', 'stats', variables.challengeId] })
      },
    })
  },
}
