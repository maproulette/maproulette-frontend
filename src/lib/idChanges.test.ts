import { describe, expect, it } from 'vitest'
import type { IdEntity, IdHistory } from '@/types/iDEditor'
import { type EntityEdit, pendingEditCount, pendingEdits } from './idChanges.ts'

const makeHistory = (
  changes: { created?: IdEntity[]; modified?: IdEntity[]; deleted?: IdEntity[] },
  baseEntities: Record<string, IdEntity> = {}
): IdHistory =>
  ({
    changes: () => ({ created: [], modified: [], deleted: [], ...changes }),
    base: () => ({ hasEntity: (id: string) => baseEntities[id] }),
  }) as unknown as IdHistory

describe('pendingEdits', () => {
  it('is empty without a history', () => {
    expect(pendingEdits(null)).toEqual([])
    expect(pendingEdits(undefined)).toEqual([])
  })

  it('reports a modified entity as a tag diff against its pre-edit state', () => {
    const history = makeHistory(
      { modified: [{ id: 'w1', type: 'way', tags: { highway: 'tertiary', surface: 'asphalt' } }] },
      { w1: { id: 'w1', tags: { highway: 'tertiary', surface: 'gravel' } } }
    )
    const [edit] = pendingEdits(history)
    expect(edit.kind).toBe('modified')
    expect(edit.tags).toEqual([
      { key: 'surface', from: 'gravel', to: 'asphalt', status: 'changed' },
    ])
  })

  it('reports a tag the mapper added', () => {
    const history = makeHistory(
      { modified: [{ id: 'w1', tags: { highway: 'tertiary', lit: 'yes' } }] },
      { w1: { id: 'w1', tags: { highway: 'tertiary' } } }
    )
    expect(pendingEdits(history)[0].tags).toEqual([
      { key: 'lit', from: null, to: 'yes', status: 'added' },
    ])
  })

  it('reports a tag the mapper removed', () => {
    const history = makeHistory(
      { modified: [{ id: 'w1', tags: {} }] },
      { w1: { id: 'w1', tags: { fixme: 'check' } } }
    )
    expect(pendingEdits(history)[0].tags).toEqual([
      { key: 'fixme', from: 'check', to: null, status: 'removed' },
    ])
  })

  it('flags an entity whose tags are unchanged as a geometry-only edit', () => {
    const history = makeHistory(
      { modified: [{ id: 'w1', tags: { highway: 'tertiary' } }] },
      { w1: { id: 'w1', tags: { highway: 'tertiary' } } }
    )
    const [edit] = pendingEdits(history)
    expect(edit.tags).toEqual([])
    expect(edit.geometryOnly).toBe(true)
  })

  it('lists created entities with all their tags as additions', () => {
    const history = makeHistory({ created: [{ id: 'n-1', tags: { amenity: 'bench' } }] })
    const [edit] = pendingEdits(history)
    expect(edit.kind).toBe('created')
    expect(edit.tags).toEqual([{ key: 'amenity', from: null, to: 'bench', status: 'added' }])
  })

  it('lists deleted entities', () => {
    const [edit] = pendingEdits(makeHistory({ deleted: [{ id: 'n5', type: 'node' }] }))
    expect(edit).toMatchObject({ id: 'n5', kind: 'deleted', tags: [] })
  })

  it('covers all three kinds at once', () => {
    const history = makeHistory({
      created: [{ id: 'n-1' }],
      modified: [{ id: 'w1' }],
      deleted: [{ id: 'r2' }],
    })
    expect(pendingEdits(history).map((edit) => edit.kind)).toEqual([
      'created',
      'modified',
      'deleted',
    ])
  })

  it('treats a missing base entity as having no tags rather than throwing', () => {
    const history = makeHistory({ modified: [{ id: 'w1', tags: { a: '1' } }] })
    expect(pendingEdits(history)[0].tags).toEqual([
      { key: 'a', from: null, to: '1', status: 'added' },
    ])
  })

  it('is empty when iD throws rather than taking the modal down with it', () => {
    const broken = {
      changes: () => {
        throw new Error('boom')
      },
    } as unknown as IdHistory
    expect(pendingEdits(broken)).toEqual([])
  })

  it('is empty when iD reports no change lists at all', () => {
    const empty = { changes: () => ({}), base: () => null } as unknown as IdHistory
    expect(pendingEdits(empty)).toEqual([])
  })

  it('copes with an iD build that exposes no base graph', () => {
    const noBase = {
      changes: () => ({ modified: [{ id: 'w1', tags: { a: '1' } }] }),
    } as unknown as IdHistory
    expect(pendingEdits(noBase)[0].tags).toEqual([
      { key: 'a', from: null, to: '1', status: 'added' },
    ])
  })

  it('falls back to an empty id for an entity iD has not numbered yet', () => {
    const history = makeHistory({ created: [{ tags: {} } as IdEntity] })
    expect(pendingEdits(history)[0].id).toBe('')
  })
})

describe('pendingEditCount', () => {
  it('counts the entities with pending edits', () => {
    expect(pendingEditCount([])).toBe(0)
    expect(
      pendingEditCount([
        { id: 'w1', kind: 'modified', tags: [], geometryOnly: true },
        { id: 'n2', kind: 'deleted', tags: [], geometryOnly: false },
      ] satisfies EntityEdit[])
    ).toBe(2)
  })
})
