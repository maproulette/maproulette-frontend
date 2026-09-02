import type { TagFix } from './cooperativeWork'

export type TagChangeStatus = 'added' | 'changed' | 'removed'

export interface TagChange {
  key: string
  /** The element's current value, or null when the tag is being added. */
  from: string | null
  /** The value after the change, or null when the tag is being removed. */
  to: string | null
  status: TagChangeStatus
}

/**
 * What a tag fix actually changes on an element, given its current tags.
 *
 * Only differences are returned: a challenge that proposes a value the element
 * already has contributes nothing, so the mapper is shown the real change
 * rather than a wall of tags they have to compare by eye.
 */
export const tagChanges = (
  currentTags: Record<string, string>,
  fix: Pick<TagFix, 'setTags' | 'unsetTags'>
): TagChange[] => {
  const changes: TagChange[] = []

  for (const [key, to] of Object.entries(fix.setTags)) {
    const from = currentTags[key]
    if (from === undefined) {
      changes.push({ key, from: null, to, status: 'added' })
    } else if (from !== to) {
      changes.push({ key, from, to, status: 'changed' })
    }
  }

  for (const key of fix.unsetTags) {
    const from = currentTags[key]
    if (from !== undefined) {
      changes.push({ key, from, to: null, status: 'removed' })
    }
  }

  return changes.sort((a, b) => a.key.localeCompare(b.key))
}

/**
 * Pull an element's tags out of the normalized form `api.osm.fetchOSMElement`
 * returns, where each `<tag k= v=>` child becomes an object and a lone tag is
 * not wrapped in an array.
 */
export const tagsFromOsmElement = (element: unknown): Record<string, string> => {
  const tag = (element as { tag?: unknown } | null)?.tag
  if (!tag) return {}
  const entries = Array.isArray(tag) ? tag : [tag]
  const tags: Record<string, string> = {}
  for (const entry of entries) {
    const { k, v } = (entry ?? {}) as { k?: unknown; v?: unknown }
    if (k !== undefined && v !== undefined) tags[String(k)] = String(v)
  }
  return tags
}
