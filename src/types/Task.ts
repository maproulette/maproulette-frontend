import type { components, operations, paths } from './openApiTypes'

/* Responses */
export type TaskStartResponse = Task & {
  lockPrimaryTaskId: number
  lockBundledTasks: number[]
}
// The plain task read (GET /task/:id) is augmented by the backend's inject() with the
// current lock holder (null when unlocked) and, when locked, the covering bundle's
// membership - so a task the caller already holds (e.g. open in another tab) can render
// as locked-by-me without this tab issuing its own /start.
export type TaskGetResponse = Task & {
  lockedBy?: number | null
  lockPrimaryTaskId?: number
  lockBundledTasks?: number[]
}
export type TaskMarkersResponse =
  paths['/taskMarkers']['get']['responses']['200']['content']['application/json']
export type TasksInBoundsResponse =
  paths['/tasks/bounds']['get']['responses']['200']['content']['application/json']

/*  Parameters  */
export type TaskMarkersParams = operations['task_marker_Data']['parameters']['query']
export type TasksInBoundsParams =
  operations['task_get_challenge_tasks_in_bounds']['parameters']['query']

/* Types From API */
export type TaskMarker = components['schemas']['org.maproulette.framework.model.TaskMarker']
export type TaskCluster =
  components['schemas']['org.maproulette.framework.model.TaskClusterSummary']
/**
 * The OpenAPI spec types `geometries` and `location` as opaque records. In
 * practice the backend guarantees `geometries` is a non-empty GeoJSON
 * FeatureCollection and `location` is a Point (derived from the geometries at
 * insert time). Narrow here so call sites don't need to cast or guard.
 */
type RawTask = components['schemas']['org.maproulette.framework.model.Task']
export type Task = Omit<RawTask, 'geometries' | 'location'> & {
  geometries: GeoJSON.FeatureCollection
  location: GeoJSON.Point
}

/** PUT /tasks/box/... with includeTotal=true (same task payload as other task list APIs) */
export type TasksBoundingBoxResponse = {
  total: number
  tasks: Task[]
}

/** Query shape for {@link TasksBoundingBoxResponse} (path + search + filter lists). */
export type TasksBoundingBoxQuery = {
  left: number
  bottom: number
  right: number
  top: number
  challengeId: number
  limit: number
  page: number
  sort: string
  order: 'ASC' | 'DESC'
  taskStatuses: number[]
  priorities: number[]
  reviewStatuses: number[]
  metaReviewStatuses: number[]
}

/* Custom Types */
export type TaskHistoryAction = {
  taskId: number
  timestamp: string
  actionType: number
  // Backend's TaskHistoryController injects { id, username } here (the original
  // TaskLogEntry only carries the user id as an Int).
  user: {
    id: number
    username: string
  } | null
  oldStatus?: number
  status?: number
  startedAt?: string
  comment?:
    | string
    | {
        id: number
        osm_id: number
        osm_username: string
        avatarUrl?: string
        taskId: number
        challengeId: number
        projectId: number
        created: number
        comment: string
        actionId?: number
      }
}

/* Task Tiles Types — query params from OpenAPI, plus z/bounds used by the MVT source builder */
export type TaskTilesQueryParams = NonNullable<
  operations['task_get_task_tiles']['parameters']['query']
>
export type TaskTilesParams = TaskTilesQueryParams & {
  z: number
  bounds: string
}
