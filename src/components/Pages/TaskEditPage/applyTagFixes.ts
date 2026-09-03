import { applyTagFix, type TagFix } from '@/lib/cooperativeWork'
import { logger } from '@/lib/logger'
import { tagChanges } from '@/lib/tagDiff'
import type { IdContext, IdGlobal } from '@/types/iDEditor'

/**
 * Apply a tag-fix challenge's proposed tag changes to the elements loaded in
 * iD, as pending edits the mapper can review, adjust or undo before saving.
 *
 * Returns the entity ids that were changed. Elements iD has not loaded yet are
 * skipped rather than guessed at, so the caller can retry as data arrives.
 */
export const applyTagFixesInId = (
  context: IdContext,
  iDGlobal: IdGlobal | undefined,
  fixes: TagFix[]
): string[] => {
  if (!iDGlobal?.actionChangeTags) return []

  const applied: string[] = []
  for (const fix of fixes) {
    try {
      const entity = context.hasEntity(fix.entityId)
      if (!entity) continue

      const nextTags = applyTagFix(entity.tags ?? {}, fix)
      // Nothing to do when the element already carries the proposed tags —
      // performing the action anyway would put a no-op on the undo stack and
      // make the task look edited when it isn't.
      if (JSON.stringify(nextTags) === JSON.stringify(entity.tags ?? {})) continue

      context.perform(
        iDGlobal.actionChangeTags(fix.entityId, nextTags),
        'MapRoulette suggested tag change'
      )
      applied.push(fix.entityId)
    } catch (error) {
      logger.warn('Could not apply suggested tag change', { entityId: fix.entityId, error })
    }
  }
  return applied
}

/**
 * Which of a task's tag fixes are not currently reflected in the editor.
 *
 * Elements iD has not loaded are treated as applied, so a slow download does
 * not momentarily look like the mapper undid something.
 */
export const unappliedTagFixes = (context: IdContext, fixes: TagFix[]): TagFix[] =>
  fixes.filter((fix) => {
    try {
      const entity = context.hasEntity(fix.entityId)
      if (!entity) return false
      return tagChanges(entity.tags ?? {}, fix).length > 0
    } catch {
      return false
    }
  })
