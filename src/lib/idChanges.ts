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
