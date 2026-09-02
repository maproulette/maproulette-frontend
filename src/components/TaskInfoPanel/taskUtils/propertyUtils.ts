import type { Task } from '@/types/Task'
import { type WorkspaceViewport, workspaceProperties } from './workspaceProperties'

/**
 * Extract feature properties from task geometries, merging across ALL features
 * (later keys win).
 */
export const getMergedFeatureProperties = (task: Task): Record<string, unknown> | null => {
  const properties: Record<string, unknown> = {}
  for (const feature of task.geometries.features) {
    if (feature.properties) {
      Object.assign(properties, feature.properties)
    }
  }
  return Object.keys(properties).length > 0 ? properties : null
}

/**
 * Replace `{{key}}` tags in text with values from the given properties map.
 * When `encode` is true, values are URI-encoded (for use in URLs).
 */
export const replacePropertyTags = (
  text: string,
  properties: Record<string, unknown>,
  encode = false
): string => {
  let result = text

  Object.keys(properties).forEach((key) => {
    // Property names come from the challenge's data, so they may contain
    // regex metacharacters.
    const pattern = new RegExp(`{{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}}}`, 'g')
    const value = encode ? encodeURIComponent(String(properties[key])) : String(properties[key])
    result = result.replace(pattern, value)
  })

  return result
}

/**
 * Substitute `{{property}}` tags in the given text using the task's feature
 * properties. Returns the original text if the task has no properties.
 */
export const substituteTaskProperties = (
  text: string,
  task: Task,
  viewport?: WorkspaceViewport | null
): string => {
  // Workspace properties are applied after the task's own, so a challenge
  // whose data happens to carry a `#`-prefixed property can't shadow them.
  const properties = {
    ...(getMergedFeatureProperties(task) ?? {}),
    ...workspaceProperties(task, viewport),
  }
  return replacePropertyTags(text, properties)
}
