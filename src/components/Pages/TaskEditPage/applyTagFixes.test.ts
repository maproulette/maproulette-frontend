import { describe, expect, it, vi } from 'vitest'
import type { TagFix } from '@/lib/cooperativeWork'
import type { IdContext, IdEntity, IdGlobal } from '@/types/iDEditor'
import { applyTagFixesInId, unappliedTagFixes } from './applyTagFixes.ts'

const fix = (props: Partial<TagFix> = {}): TagFix => ({
  elementId: 'way/1',
  entityId: 'w1',
  setTags: { surface: 'asphalt' },
  unsetTags: [],
  ...props,
})

const makeContext = (entities: Record<string, IdEntity | undefined>) => {
  const perform = vi.fn()
  const context = {
    hasEntity: (id: string) => entities[id],
    entity: (id: string) => entities[id],
    perform,
  } as unknown as IdContext
  return { context, perform }
}

const iDGlobal = {
  actionChangeTags: (entityId: string, tags: Record<string, string>) => ({ entityId, tags }),
} as unknown as IdGlobal

describe('applyTagFixesInId', () => {
  it('performs a tag change for a loaded element', () => {
    const { context, perform } = makeContext({ w1: { tags: { highway: 'residential' } } })
    expect(applyTagFixesInId(context, iDGlobal, [fix()])).toEqual(['w1'])
    expect(perform).toHaveBeenCalledTimes(1)
    expect(perform.mock.calls[0][0]).toEqual({
      entityId: 'w1',
      tags: { highway: 'residential', surface: 'asphalt' },
    })
  })

  it('annotates the edit so it reads sensibly in the undo history', () => {
    const { context, perform } = makeContext({ w1: { tags: {} } })
    applyTagFixesInId(context, iDGlobal, [fix()])
    expect(perform.mock.calls[0][1]).toBe('MapRoulette suggested tag change')
  })

  it('skips elements iD has not loaded, so the caller can retry', () => {
    const { context, perform } = makeContext({})
    expect(applyTagFixesInId(context, iDGlobal, [fix()])).toEqual([])
    expect(perform).not.toHaveBeenCalled()
  })

  it('does nothing when the element already carries the proposed tags', () => {
    const { context, perform } = makeContext({ w1: { tags: { surface: 'asphalt' } } })
    expect(applyTagFixesInId(context, iDGlobal, [fix()])).toEqual([])
    expect(perform).not.toHaveBeenCalled()
  })

  it('removes unset tags', () => {
    const { context, perform } = makeContext({ w1: { tags: { fixme: 'check', a: '1' } } })
    applyTagFixesInId(context, iDGlobal, [fix({ setTags: {}, unsetTags: ['fixme'] })])
    expect(perform.mock.calls[0][0].tags).toEqual({ a: '1' })
  })

  it('applies each element independently and reports which were changed', () => {
    const { context } = makeContext({ w1: { tags: {} }, w2: undefined })
    const result = applyTagFixesInId(context, iDGlobal, [
      fix(),
      fix({ elementId: 'way/2', entityId: 'w2' }),
    ])
    expect(result).toEqual(['w1'])
  })

  it('does nothing when iD has not exposed the action', () => {
    const { context, perform } = makeContext({ w1: { tags: {} } })
    expect(applyTagFixesInId(context, undefined, [fix()])).toEqual([])
    expect(perform).not.toHaveBeenCalled()
  })

  it('carries on when one element throws', () => {
    const perform = vi.fn()
    const context = {
      hasEntity: (id: string) => {
        if (id === 'w1') throw new Error('boom')
        return { tags: {} }
      },
      perform,
    } as unknown as IdContext
    const result = applyTagFixesInId(context, iDGlobal, [
      fix(),
      fix({ elementId: 'way/2', entityId: 'w2' }),
    ])
    expect(result).toEqual(['w2'])
  })
})

describe('unappliedTagFixes', () => {
  it('is empty when the element already carries the proposed tags', () => {
    const { context } = makeContext({ w1: { tags: { surface: 'asphalt' } } })
    expect(unappliedTagFixes(context, [fix()])).toEqual([])
  })

  it('reports a fix the mapper has undone', () => {
    const { context } = makeContext({ w1: { tags: { surface: 'gravel' } } })
    expect(unappliedTagFixes(context, [fix()]).map((f) => f.entityId)).toEqual(['w1'])
  })

  it('reports a fix whose value the mapper changed to something else', () => {
    const { context } = makeContext({ w1: { tags: { surface: 'concrete' } } })
    expect(unappliedTagFixes(context, [fix()])).toHaveLength(1)
  })

  it('treats an unloaded element as applied, so a slow download is not mistaken for an undo', () => {
    const { context } = makeContext({})
    expect(unappliedTagFixes(context, [fix()])).toEqual([])
  })

  it('reports an unset tag that has come back', () => {
    const { context } = makeContext({ w1: { tags: { fixme: 'check' } } })
    const unset = fix({ setTags: {}, unsetTags: ['fixme'] })
    expect(unappliedTagFixes(context, [unset])).toHaveLength(1)
  })

  it('checks each element independently', () => {
    const { context } = makeContext({
      w1: { tags: { surface: 'asphalt' } },
      w2: { tags: { surface: 'gravel' } },
    })
    const result = unappliedTagFixes(context, [fix(), fix({ elementId: 'way/2', entityId: 'w2' })])
    expect(result.map((f) => f.entityId)).toEqual(['w2'])
  })
})
