import { describe, expect, it, vi } from 'vitest'
import type { TagFix } from '@/lib/cooperativeWork'
import type { IdContext, IdEntity, IdGlobal } from '@/types/iDEditor'
import {
  applyTagFixesInId,
  divergedTagFixes,
  resetTagFixesInId,
  revertTagFixesInId,
} from './applyTagFixes.ts'

const fix = (props: Partial<TagFix> = {}): TagFix => ({
  elementId: 'way/1',
  entityId: 'w1',
  setTags: { surface: 'asphalt' },
  unsetTags: [],
  ...props,
})

const makeContext = (
  entities: Record<string, IdEntity | undefined>,
  baseEntities: Record<string, IdEntity | undefined> = {}
) => {
  const perform = vi.fn()
  const context = {
    hasEntity: (id: string) => entities[id],
    entity: (id: string) => entities[id],
    perform,
    history: () => ({ base: () => ({ hasEntity: (id: string) => baseEntities[id] }) }),
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

describe('divergedTagFixes', () => {
  // The element started as gravel; the challenge suggests asphalt.
  const base = { w1: { tags: { highway: 'residential', surface: 'gravel' } } }
  const suggested = { highway: 'residential', surface: 'asphalt' }

  it('is empty when the element matches the suggestion exactly', () => {
    const { context } = makeContext({ w1: { tags: suggested } }, base)
    expect(divergedTagFixes(context, [fix()])).toEqual([])
  })

  it('reports a suggestion the mapper undid', () => {
    const { context } = makeContext({ w1: { tags: base.w1.tags } }, base)
    expect(divergedTagFixes(context, [fix()])).toHaveLength(1)
  })

  it('reports an element the mapper edited further, even if the suggestion still holds', () => {
    const { context } = makeContext({ w1: { tags: { ...suggested, tunnel: 'yes' } } }, base)
    expect(divergedTagFixes(context, [fix()])).toHaveLength(1)
  })

  it('reports a suggested value the mapper mistyped', () => {
    const { context } = makeContext({ w1: { tags: { ...suggested, surface: 'asphal' } } }, base)
    expect(divergedTagFixes(context, [fix()])).toHaveLength(1)
  })

  it('treats an unloaded element as matching', () => {
    const { context } = makeContext({}, base)
    expect(divergedTagFixes(context, [fix()])).toEqual([])
  })
})

describe('resetTagFixesInId', () => {
  const base = { w1: { tags: { highway: 'residential', surface: 'gravel' } } }

  it('restores the original tags with the suggestion applied', () => {
    const { context, perform } = makeContext({ w1: { tags: { surface: 'concrete' } } }, base)
    expect(resetTagFixesInId(context, iDGlobal, [fix()])).toEqual(['w1'])
    expect(perform.mock.calls[0][0].tags).toEqual({
      highway: 'residential',
      surface: 'asphalt',
    })
  })

  it('discards unrelated tags the mapper added to the element', () => {
    const { context, perform } = makeContext(
      { w1: { tags: { highway: 'residential', surface: 'asphalt', tunnel: 'yes', layer: '-1' } } },
      base
    )
    resetTagFixesInId(context, iDGlobal, [fix()])
    expect(perform.mock.calls[0][0].tags).toEqual({
      highway: 'residential',
      surface: 'asphalt',
    })
  })

  it('does nothing when the element already matches the suggestion', () => {
    const { context, perform } = makeContext(
      { w1: { tags: { highway: 'residential', surface: 'asphalt' } } },
      base
    )
    expect(resetTagFixesInId(context, iDGlobal, [fix()])).toEqual([])
    expect(perform).not.toHaveBeenCalled()
  })

  it('annotates the edit so the undo history explains it', () => {
    const { context, perform } = makeContext({ w1: { tags: {} } }, base)
    resetTagFixesInId(context, iDGlobal, [fix()])
    expect(perform.mock.calls[0][1]).toBe('Reset to MapRoulette suggested tags')
  })

  it('does nothing when iD has not exposed the action', () => {
    const { context, perform } = makeContext({ w1: { tags: {} } }, base)
    expect(resetTagFixesInId(context, undefined, [fix()])).toEqual([])
    expect(perform).not.toHaveBeenCalled()
  })
})

describe('revertTagFixesInId', () => {
  const base = { w1: { tags: { highway: 'residential', surface: 'gravel' } } }

  it('puts a changed tag back to the value it had before', () => {
    const { context, perform } = makeContext(
      { w1: { tags: { highway: 'residential', surface: 'asphalt' } } },
      base
    )
    expect(revertTagFixesInId(context, iDGlobal, [fix()])).toEqual(['w1'])
    expect(perform.mock.calls[0][0].tags).toEqual({
      highway: 'residential',
      surface: 'gravel',
    })
  })

  it('removes a tag the fix introduced, since it was never there', () => {
    const { context, perform } = makeContext(
      { w1: { tags: { highway: 'residential', lit: 'yes' } } },
      { w1: { tags: { highway: 'residential' } } }
    )
    revertTagFixesInId(context, iDGlobal, [fix({ setTags: { lit: 'yes' } })])
    expect(perform.mock.calls[0][0].tags).toEqual({ highway: 'residential' })
  })

  it('brings back a tag the fix removed', () => {
    const { context, perform } = makeContext(
      { w1: { tags: { highway: 'residential' } } },
      { w1: { tags: { highway: 'residential', fixme: 'check' } } }
    )
    revertTagFixesInId(context, iDGlobal, [fix({ setTags: {}, unsetTags: ['fixme'] })])
    expect(perform.mock.calls[0][0].tags).toEqual({ highway: 'residential', fixme: 'check' })
  })

  it("leaves the mapper's own edits to the same element alone", () => {
    const { context, perform } = makeContext(
      { w1: { tags: { highway: 'residential', surface: 'asphalt', tunnel: 'yes' } } },
      base
    )
    revertTagFixesInId(context, iDGlobal, [fix()])
    expect(perform.mock.calls[0][0].tags).toEqual({
      highway: 'residential',
      surface: 'gravel',
      tunnel: 'yes',
    })
  })

  it('does nothing when the fix was never applied', () => {
    const { context, perform } = makeContext({ w1: { tags: base.w1.tags } }, base)
    expect(revertTagFixesInId(context, iDGlobal, [fix()])).toEqual([])
    expect(perform).not.toHaveBeenCalled()
  })
})
