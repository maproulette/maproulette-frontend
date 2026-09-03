import { applyTagFix, type TagFix } from '@/lib/cooperativeWork'
import { logger } from '@/lib/logger'
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
 * The tags an element should carry for the challenge's suggestion to be
 * satisfied: how it looked before any editing, with the fix applied.
 */
const targetTags = (context: IdContext, fix: TagFix): Record<string, string> => {
  const base = context.history?.().base?.().hasEntity(fix.entityId)?.tags ?? {}
  return applyTagFix(base, fix)
}

const sameTags = (a: Record<string, string>, b: Record<string, string>): boolean => {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

/**
 * Tag fixes whose elements no longer look the way the challenge suggested,
 * whether because the mapper undid the change or because they edited the
 * element further.
 *
 * Elements iD has not loaded are treated as matching, so a slow download does
 * not momentarily look like the mapper changed something.
 */
export const divergedTagFixes = (context: IdContext, fixes: TagFix[]): TagFix[] =>
  fixes.filter((fix) => {
    try {
      const entity = context.hasEntity(fix.entityId)
      if (!entity) return false
      return !sameTags(entity.tags ?? {}, targetTags(context, fix))
    } catch {
      return false
    }
  })

/**
 * Put the tag-fix elements back exactly as the challenge suggested: their
 * original tags with the fix applied, discarding anything else the mapper did
 * to them.
 *
 * This is a reset rather than a re-apply — re-applying only the suggested tags
 * would leave unrelated edits on the element in place, which is not what
 * someone asking to go back to the suggestion means.
 */
export const resetTagFixesInId = (
  context: IdContext,
  iDGlobal: IdGlobal | undefined,
  fixes: TagFix[]
): string[] => {
  if (!iDGlobal?.actionChangeTags) return []

  const reset: string[] = []
  for (const fix of fixes) {
    try {
      const entity = context.hasEntity(fix.entityId)
      if (!entity) continue

      const target = targetTags(context, fix)
      if (sameTags(entity.tags ?? {}, target)) continue

      context.perform(
        iDGlobal.actionChangeTags(fix.entityId, target),
        'Reset to MapRoulette suggested tags'
      )
      reset.push(fix.entityId)
    } catch (error) {
      logger.warn('Could not reset to suggested tags', { entityId: fix.entityId, error })
    }
  }
  return reset
}

/**
 * Undo a tag fix without disturbing anything else on the element: keys the fix
 * set go back to their original values (or away, if the fix introduced them),
 * and keys it removed come back.
 *
 * Used when a task leaves the bundle — its suggestion should stop applying,
 * but any editing the mapper did to that element themselves is theirs to keep.
 */
export const revertTagFixesInId = (
  context: IdContext,
  iDGlobal: IdGlobal | undefined,
  fixes: TagFix[]
): string[] => {
  if (!iDGlobal?.actionChangeTags) return []

  const reverted: string[] = []
  for (const fix of fixes) {
    try {
      const entity = context.hasEntity(fix.entityId)
      if (!entity) continue

      const base = context.history?.().base?.().hasEntity(fix.entityId)?.tags ?? {}
      const next = { ...(entity.tags ?? {}) }
      for (const key of Object.keys(fix.setTags)) {
        if (key in base) next[key] = base[key]
        else delete next[key]
      }
      for (const key of fix.unsetTags) {
        if (key in base) next[key] = base[key]
      }

      if (sameTags(entity.tags ?? {}, next)) continue
      context.perform(
        iDGlobal.actionChangeTags(fix.entityId, next),
        'Removed MapRoulette suggested tag change'
      )
      reverted.push(fix.entityId)
    } catch (error) {
      logger.warn('Could not revert suggested tag change', { entityId: fix.entityId, error })
    }
  }
  return reverted
}
