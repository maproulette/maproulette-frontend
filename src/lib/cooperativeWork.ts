import type { Task } from '@/types/Task'

/** Kinds of cooperative challenge, as numbered by the server. */
export const COOPERATIVE_TYPE = {
  none: 0,
  tags: 1,
  changeFile: 2,
} as const

/** A tag change the challenge proposes for one OSM element. */
export interface TagFix {
  /** OSM element id in `way/123` form. */
  elementId: string
  /** iD's own id for the same element, e.g. `w123`. */
  entityId: string
  /** Tags to set or overwrite. */
  setTags: Record<string, string>
  /** Tag keys to remove. */
  unsetTags: string[]
}

interface CooperativeWork {
  meta?: { version?: number; type?: number }
  operations?: Array<{
    operationType?: string
    data?: {
      id?: string
      operations?: Array<{ operation?: string; data?: unknown }>
    }
  }>
}

const cooperativeWork = (task: Task): CooperativeWork | null => {
  const work = (task as { cooperativeWork?: unknown }).cooperativeWork
  return work && typeof work === 'object' ? (work as CooperativeWork) : null
}

/**
 * The kind of cooperative work on a task. Version 1 of the format predates the
 * `type` field and only ever described tag fixes.
 */
export const cooperativeWorkType = (task: Task): number => {
  const work = cooperativeWork(task)
  if (!work) return COOPERATIVE_TYPE.none
  if (work.meta?.version === 1) return COOPERATIVE_TYPE.tags
  return work.meta?.type ?? COOPERATIVE_TYPE.none
}

/** iD identifies elements as `w123`; the cooperative format uses `way/123`. */
export const toIdEntityId = (elementId: string): string | null => {
  const match = /^(node|way|relation)\/(\d+)$/.exec(elementId)
  if (!match) return null
  return `${match[1][0]}${match[2]}`
}

/**
 * Tag changes a tag-fix task proposes, one entry per OSM element.
 *
 * Only `modifyElement` operations are returned: element creation and deletion
 * are part of the format but are not something a tag fix expresses, and
 * applying them automatically in the editor would be a much bigger claim than
 * "here are some tags we think should change".
 */
export const tagFixes = (task: Task): TagFix[] => {
  if (cooperativeWorkType(task) !== COOPERATIVE_TYPE.tags) return []

  const fixes: TagFix[] = []
  for (const operation of cooperativeWork(task)?.operations ?? []) {
    if (operation.operationType !== 'modifyElement') continue

    const elementId = operation.data?.id
    const entityId = elementId ? toIdEntityId(elementId) : null
    if (!elementId || !entityId) continue

    const setTags: Record<string, string> = {}
    const unsetTags: string[] = []

    for (const change of operation.data?.operations ?? []) {
      if (change.operation === 'setTags' && change.data && typeof change.data === 'object') {
        for (const [key, value] of Object.entries(change.data as Record<string, unknown>)) {
          setTags[key] = String(value)
        }
      } else if (change.operation === 'unsetTags' && Array.isArray(change.data)) {
        for (const key of change.data) {
          if (typeof key === 'string') unsetTags.push(key)
        }
      }
    }

    if (Object.keys(setTags).length > 0 || unsetTags.length > 0) {
      fixes.push({ elementId, entityId, setTags, unsetTags })
    }
  }
  return fixes
}

/** Whether this task carries tag changes we can apply in the editor. */
export const isTagFixTask = (task: Task): boolean => tagFixes(task).length > 0

/**
 * The tags an element should end up with: its current tags, with the proposed
 * additions applied and the proposed removals dropped.
 */
export const applyTagFix = (
  currentTags: Record<string, string>,
  fix: TagFix
): Record<string, string> => {
  const next = { ...currentTags, ...fix.setTags }
  for (const key of fix.unsetTags) delete next[key]
  return next
}
