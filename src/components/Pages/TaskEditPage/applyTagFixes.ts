import { applyTagFix, type TagFix } from '@/lib/cooperativeWork'
import { changeSignature } from '@/lib/idChanges'
import { logger } from '@/lib/logger'
import { type IdContext, type IdGlobal, isEntityLoaded } from '@/types/iDEditor'

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

/** Key iD's history files MapRoulette's checkpoint under. */
const SUGGESTION_CHECKPOINT = 'maproulette-suggestion'

/**
 * Remember the editor exactly as it stands, as the state MapRoulette set up:
 * the challenge's suggestion applied and nothing else done to it yet.
 *
 * Returns a signature of the edits at that moment, which is what tells the
 * mapper's later work apart from it, or null if iD would not take the
 * checkpoint — in which case there is nothing to offer a reset back to.
 */
export const markSuggestionCheckpoint = (context: IdContext): string | null => {
  try {
    const history = context.history?.()
    if (!history?.checkpoint) return null

    history.checkpoint(SUGGESTION_CHECKPOINT)
    return changeSignature(history)
  } catch (error) {
    logger.warn('Could not record the suggested-change checkpoint', { error })
    return null
  }
}

/**
 * Put the editor back to the checkpoint: the challenge's suggestion and
 * nothing else. Everything the mapper has done since is discarded, which is
 * what makes this a reset rather than an undo of the suggestion alone.
 *
 * Restoring the graph wholesale is the only way to reach the mapper's geometry
 * — new nodes, moved vertices, a reshaped way. Replaying tags could never undo
 * any of it.
 */
export const restoreSuggestionCheckpoint = (
  context: IdContext,
  iDGlobal: IdGlobal | undefined
): boolean => {
  try {
    const history = context.history?.()
    if (!history?.reset) return false

    // iD's select mode holds the entities it is editing, and the reset can
    // take them out of the graph underneath it, so step back to browse first.
    if (iDGlobal?.modeBrowse) context.enter(iDGlobal.modeBrowse(context))
    history.reset(SUGGESTION_CHECKPOINT)
    return true
  } catch (error) {
    logger.error("Could not reset to the challenge's suggestion", { error })
    return false
  }
}

export const discardAllEdits = (context: IdContext, iDGlobal: IdGlobal | undefined): boolean => {
  try {
    const history = context.history?.()
    if (!history?.reset) return false
    if (iDGlobal?.modeBrowse) context.enter(iDGlobal.modeBrowse(context))
    history.reset()
    return true
  } catch (error) {
    logger.error("Could not discard the editor's unsaved edits", { error })
    return false
  }
}

const sameTags = (a: Record<string, string>, b: Record<string, string>): boolean => {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
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

/**
 * The tag fixes an editing session owes, and the ones it has already made.
 *
 * A fix cannot be applied until iD has downloaded its element, and that can
 * happen at any point — a mapper who opens the editor zoomed out sees nothing
 * downloaded until they zoom in. So fixes wait here until their element turns
 * up rather than being attempted for a few seconds and then dropped, and what
 * has landed is remembered so nothing is applied twice or reverted blindly.
 */
export const createTagFixQueue = () => {
  const waiting = new Map<string, TagFix>()
  const done = new Map<string, TagFix>()

  return {
    /**
     * Line the queue up with the fixes now wanted — the bundle's, which changes
     * as tasks join and leave it. Fixes that are no longer wanted are undone,
     * and ones not yet made are queued for the next flush.
     *
     * Returns the entity ids it undid, so a caller tracking what MapRoulette
     * has put in the editor can tell a no-op sync from one that changed it.
     */
    sync: (context: IdContext, iDGlobal: IdGlobal | undefined, fixes: TagFix[]): string[] => {
      const wanted = new Map(fixes.map((fix) => [fix.entityId, fix]))

      let reverted: string[] = []
      const dropped = [...done.values()].filter((fix) => !wanted.has(fix.entityId))
      if (dropped.length > 0) {
        reverted = revertTagFixesInId(context, iDGlobal, dropped)
        for (const fix of dropped) done.delete(fix.entityId)
      }
      for (const entityId of [...waiting.keys()]) {
        if (!wanted.has(entityId)) waiting.delete(entityId)
      }

      for (const [entityId, fix] of wanted) {
        if (!done.has(entityId)) waiting.set(entityId, fix)
      }

      return reverted
    },

    /**
     * Apply every queued fix whose element iD has since loaded, leaving the
     * rest queued. Returns the entity ids that came off the queue.
     */
    flush: (context: IdContext, iDGlobal: IdGlobal | undefined): string[] => {
      const loaded = [...waiting.values()].filter((fix) => isEntityLoaded(context, fix.entityId))
      if (loaded.length === 0) return []

      applyTagFixesInId(context, iDGlobal, loaded)
      // A loaded element is settled whether or not there was an edit to make:
      // one that already carries the suggested tags needs no change.
      for (const fix of loaded) {
        waiting.delete(fix.entityId)
        done.set(fix.entityId, fix)
      }
      return loaded.map((fix) => fix.entityId)
    },

    /** How many fixes are still waiting on iD to download their element. */
    waitingCount: () => waiting.size,
  }
}
