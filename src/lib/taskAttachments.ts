import type { Task } from '@/types/Task'

/**
 * Supplemental data a challenge can attach to a task. Only `referenceLayer`
 * attachments are acted on: they are handed to JOSM as extra layers during
 * task completion. Everything else — `blob` in particular — travels with the
 * task for external processes and is deliberately ignored here.
 */
export interface TaskAttachment {
  id: string
  kind: string
  /** `geojson`, `osm`, `gpx`, … */
  type?: string
  name?: string
  settings?: {
    layerLocked?: boolean
    uploadPolicy?: string
    downloadPolicy?: string
  }
}

/**
 * Attachments carried by a task. The format allows them on the task's
 * FeatureCollection or on an individual Feature, so both are gathered.
 */
export const taskAttachments = (task: Task): TaskAttachment[] => {
  const geometries = task.geometries as unknown as {
    attachments?: unknown
    features?: Array<{ attachments?: unknown }>
  }
  const collected = [
    ...(Array.isArray(geometries?.attachments) ? geometries.attachments : []),
    ...(geometries?.features ?? []).flatMap((feature) =>
      Array.isArray(feature?.attachments) ? feature.attachments : []
    ),
  ]
  return collected.filter(
    (attachment): attachment is TaskAttachment =>
      !!attachment &&
      typeof (attachment as TaskAttachment).id === 'string' &&
      typeof (attachment as TaskAttachment).kind === 'string'
  )
}

export const referenceLayers = (task: Task): TaskAttachment[] =>
  taskAttachments(task).filter((attachment) => attachment.kind === 'referenceLayer')

const snakeCase = (value: string): string =>
  value
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()

/**
 * Filename JOSM is told to use for the layer. It ends in the data's type so
 * JOSM picks the right importer.
 */
export const attachmentFilename = (taskId: number, attachment: TaskAttachment): string => {
  const stem = attachment.name
    ? `${snakeCase(attachment.name)}_${taskId}`
    : `task_attachment_${taskId}_${attachment.id}`
  return `${stem}.${attachment.type ?? 'geojson'}`
}

/** Where the backend serves an attachment's data. */
export const attachmentDataUrl = (
  apiBaseUrl: string,
  taskId: number,
  attachment: TaskAttachment
): string =>
  `${apiBaseUrl.replace(/\/+$/, '')}/api/v2/task/${taskId}/attachment/${attachment.id}/data/${attachmentFilename(taskId, attachment)}`

/**
 * JOSM remote-control `import` command for a reference layer.
 *
 * Reference layers default to locked with upload and download both disabled,
 * so a mapper cannot accidentally edit or submit the reference data. A
 * challenge can relax that through the attachment's `settings`.
 */
export const josmImportUrl = (
  josmHost: string,
  apiBaseUrl: string,
  taskId: number,
  attachment: TaskAttachment
): string => {
  const settings = attachment.settings ?? {}
  const parts = [
    'new_layer=true',
    `layer_name=${encodeURIComponent(attachment.name || `MR Task ${taskId} Reference`)}`,
    `layer_locked=${(settings.layerLocked ?? true) ? 'true' : 'false'}`,
    `download_policy=${encodeURIComponent(settings.downloadPolicy ?? 'never')}`,
    `upload_policy=${encodeURIComponent(settings.uploadPolicy ?? 'never')}`,
    `url=${encodeURIComponent(attachmentDataUrl(apiBaseUrl, taskId, attachment))}`,
  ]
  return `${josmHost.replace(/\/+$/, '')}/import?${parts.join('&')}`
}
