import type { components } from './openApiTypes'

/* Responses */
export type TaskStartResponse = Task & {
  lockPrimaryTaskId: number
  lockBundledTasks: number[]
}
/**
 * What `PUT /task/:id/lockBundle` returns: the lock the caller now holds, with
 * no task attached. Declared from what the controller writes -- the API spec
 * declares no response body for this endpoint at all.
 */
export type TaskBundleLockResponse = Pick<
  TaskStartResponse,
  'lockPrimaryTaskId' | 'lockBundledTasks'
>
// The plain task read (GET /task/:id) is augmented by the backend with the current lock
// holder (null when unlocked) and, when locked, the covering bundle's membership - so a
// task the caller already holds (e.g. open in another tab) can render as locked-by-me
// without this tab issuing its own /start.
export type TaskGetResponse = Task & {
  lockedBy?: number | null
  lockBundledTasks?: number[]
}

/* Types From API */
export type TaskMarker = components['schemas']['org.maproulette.framework.model.TaskMarker']
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

/* Custom Types */
type TaskHistoryUserRef = {
  id: number
  username: string
}

export type TaskHistoryAction = {
  taskId: number
  timestamp: string
  actionType: number
  // Backend's TaskHistoryController injects { id, username } here (the original
  // TaskLogEntry only carries the user id as an Int).
  user: TaskHistoryUserRef | null
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
  /**
   * Additional fields returned by the history API.
   * Core only interprets known keys above; plugins read domain-specific extras.
   */
  [key: string]: unknown
}
