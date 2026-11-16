import type { IdEntity, IdGraph, IdHistory } from '@/types/iDEditor'
import { type TagChange, tagChanges } from './tagDiff'

export type EditKind = 'created' | 'modified' | 'deleted'

export interface EntityEdit {
  /** iD's id for the entity, e.g. `w123`. */
  id: string
  /** `node` / `way` / `relation`, where iD reports it. */
  type?: string
  kind: EditKind
  /** Tag differences against the entity's pre-edit state. Empty for geometry-only edits. */
  tags: TagChange[]
  /** True when the entity changed but none of its tags did — a geometry move, say. */
  geometryOnly: boolean
}

const entityId = (entity: IdEntity): string => entity.id ?? ''

/** Diff one modified entity's tags against how it looked before editing. */
const modifiedTagChanges = (entity: IdEntity, base: IdGraph | null): TagChange[] => {
  const before = base?.hasEntity(entityId(entity))?.tags ?? {}
  const after = entity.tags ?? {}

  const setTags: Record<string, string> = {}
  for (const [key, value] of Object.entries(after)) {
    if (before[key] !== value) setTags[key] = value
  }
  const unsetTags = Object.keys(before).filter((key) => !(key in after))

  return tagChanges(before, { setTags, unsetTags })
}

/**
 * The edits currently pending in iD, as a list the mapper can read.
 *
 * This reflects the editor's own state — whatever they have actually done,
 * including anything MapRoulette applied on their behalf and anything they
 * then changed or undid. It is deliberately not the challenge's proposal,
 * which says what *should* happen rather than what has.
 */
export const pendingEdits = (history: IdHistory | null | undefined): EntityEdit[] => {
  if (!history) return []

  let changes: ReturnType<IdHistory['changes']>
  let base: IdGraph | null = null
  try {
    changes = history.changes()
    base = history.base?.() ?? null
  } catch {
    return []
  }

  const edits: EntityEdit[] = []

  for (const entity of changes.created ?? []) {
    edits.push({
      id: entityId(entity),
      type: entity.type,
      kind: 'created',
      tags: tagChanges({}, { setTags: entity.tags ?? {}, unsetTags: [] }),
      geometryOnly: Object.keys(entity.tags ?? {}).length === 0,
    })
  }

  for (const entity of changes.modified ?? []) {
    const tags = modifiedTagChanges(entity, base)
    edits.push({
      id: entityId(entity),
      type: entity.type,
      kind: 'modified',
      tags,
      geometryOnly: tags.length === 0,
    })
  }

  for (const entity of changes.deleted ?? []) {
    edits.push({
      id: entityId(entity),
      type: entity.type,
      kind: 'deleted',
      tags: [],
      geometryOnly: false,
    })
  }

  return edits
}

/** Total number of entities with pending edits. */
export const pendingEditCount = (edits: EntityEdit[]): number => edits.length

/**
 * How one changed entity currently looks, as a string: its tags and its
 * geometry, both of which a mapper can change.
 */
const entitySignature = (kind: EditKind, entity: IdEntity): string => {
  const tags = Object.entries(entity.tags ?? {})
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join(',')

  // Only one of these is ever set: a node has a position, a way has child
  // nodes, a relation has members.
  const geometry = entity.loc
    ? entity.loc.join(' ')
    : entity.nodes
      ? entity.nodes.join(' ')
      : (entity.members ?? []).map((m) => `${m.type ?? ''}${m.id ?? ''}/${m.role ?? ''}`).join(' ')

  return `${kind} ${entityId(entity)} [${tags}] (${geometry})`
}

/**
 * A stable string standing for everything currently pending in the editor.
 *
 * Two of these are compared to tell whether the mapper has touched anything
 * since MapRoulette applied the challenge's suggestion for them. Tags alone
 * would not do it: moving a node or adding one to a way leaves every tag in
 * the task exactly as the challenge asked for.
 */
export const changeSignature = (history: IdHistory | null | undefined): string => {
  if (!history) return ''

  let changes: ReturnType<IdHistory['changes']>
  try {
    changes = history.changes()
  } catch {
    return ''
  }

  return [
    ...(changes.created ?? []).map((entity) => entitySignature('created', entity)),
    ...(changes.modified ?? []).map((entity) => entitySignature('modified', entity)),
    ...(changes.deleted ?? []).map((entity) => entitySignature('deleted', entity)),
  ]
    .sort()
    .join('|')
}
