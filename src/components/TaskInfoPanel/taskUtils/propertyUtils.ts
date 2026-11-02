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

const propertyValue = (properties: Record<string, unknown>, name: string): unknown => {
  if (Object.hasOwn(properties, name)) return properties[name]
  let value: unknown = properties
  for (const segment of name.split('.')) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, segment)) {
      return undefined
    }
    value = (value as Record<string, unknown>)[segment]
  }
  return value
}

/**
 * Replace `{{key}}` tags in text with values from the given properties map,
 * or with an empty string when the property is missing. `{{{key}}}` is left
 * alone. When `encode` is true, values are URI-encoded (for use in URLs).
 */
export const replacePropertyTags = (
  text: string,
  properties: Record<string, unknown>,
  encode = false
): string =>
  text.replace(/(^|[^{])\{\{([^{][^}]*)}}/g, (_match, firstChar: string, name: string) => {
    const value = String(propertyValue(properties, name) ?? '')
    return firstChar + (encode ? encodeURIComponent(value) : value)
  })

const taskSubstitutionProperties = (
  task: Task,
  viewport?: WorkspaceViewport | null
): Record<string, unknown> => ({
  // Workspace properties are applied after the task's own, so a challenge
  // whose data happens to carry a `#`-prefixed property can't shadow them.
  ...(getMergedFeatureProperties(task) ?? {}),
  ...workspaceProperties(task, viewport),
})

/**
 * Substitute `{{property}}` tags in the given text using the task's feature
 * properties.
 */
export const substituteTaskProperties = (
  text: string,
  task: Task,
  viewport?: WorkspaceViewport | null
): string => replacePropertyTags(text, taskSubstitutionProperties(task, viewport))

export const substituteMarkdownTaskProperties = (
  markdown: string,
  task: Task,
  viewport?: WorkspaceViewport | null
): string => {
  const properties = taskSubstitutionProperties(task, viewport)
  const linked = markdown.replace(
    /\]\s*\(([^)]*\{\{[^}]*\}\}[^)]*)\)/g,
    (_match, url: string) => `](${replacePropertyTags(url, properties, true)})`
  )
  return replacePropertyTags(linked, properties)
}
