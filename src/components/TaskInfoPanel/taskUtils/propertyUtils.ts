import type { Task } from '@/types/Task'

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
    const pattern = new RegExp(`{{${key}}}`, 'g')
    const value = encode ? encodeURIComponent(String(properties[key])) : String(properties[key])
    result = result.replace(pattern, value)
  })

  return result
}

/**
 * Substitute `{{property}}` tags in the given text using the task's feature
 * properties. Returns the original text if the task has no properties.
 */
export const substituteTaskProperties = (text: string, task: Task): string => {
  const properties = getMergedFeatureProperties(task)
  return properties ? replacePropertyTags(text, properties) : text
}
