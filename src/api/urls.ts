import { attachmentFilename, type TaskAttachment } from '@/lib/taskAttachments'
import { apiBaseUrl } from './client'

// Backend URLs that something other than apiRequest fetches: map tile sources,
// <img> srcs, and files JOSM downloads itself (so they must be absolute).

/** Vector tiles of task markers, in MapLibre's `{z}/{x}/{y}` template form. */
export const taskTilesUrl = ({ global = false }: { global?: boolean } = {}): string =>
  `${apiBaseUrl}/api/v2/taskTilesMvt/{z}/{x}/{y}${global ? '?global=true' : ''}`

/** A change-file task's osmChange XML, named with the .osc extension JOSM expects. */
export const changeFileUrl = (taskId: number): string =>
  `${apiBaseUrl}/api/v2/task/${taskId}/cooperative/change/task_${taskId}_change.osc`

export const attachmentDataUrl = (taskId: number, attachment: TaskAttachment): string =>
  `${apiBaseUrl}/api/v2/task/${taskId}/attachment/${attachment.id}/data/${attachmentFilename(taskId, attachment)}`

/**
 * Team images and uploaded avatars come from the backend as root-relative
 * paths (`/api/v2/teamImage/:id/file`) so the same stored value works across
 * environments, which means they have to be resolved against the API host
 * rather than the app's own origin. Absolute URLs pass through untouched.
 */
export const resolveTeamImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path
  return `${apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}
