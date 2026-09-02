import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import {
  applyTagFix,
  COOPERATIVE_TYPE,
  cooperativeWorkType,
  isTagFixTask,
  tagFixes,
  toIdEntityId,
} from './cooperativeWork.ts'

const tagFixTask = (operations: unknown[], meta: unknown = { version: 2, type: 1 }): Task =>
  ({ id: 1, cooperativeWork: { meta, operations } }) as unknown as Task

const modify = (id: string, ops: unknown[]) => ({
  operationType: 'modifyElement',
  data: { id, operations: ops },
})

describe('cooperativeWorkType', () => {
  it('is none for an ordinary task', () => {
    expect(cooperativeWorkType({ id: 1 } as Task)).toBe(COOPERATIVE_TYPE.none)
  })

  it('reads the type from v2 metadata', () => {
    expect(cooperativeWorkType(tagFixTask([]))).toBe(COOPERATIVE_TYPE.tags)
    expect(cooperativeWorkType(tagFixTask([], { version: 2, type: 2 }))).toBe(
      COOPERATIVE_TYPE.changeFile
    )
  })

  it('treats v1 as a tag fix, since that is all it could express', () => {
    expect(cooperativeWorkType(tagFixTask([], { version: 1 }))).toBe(COOPERATIVE_TYPE.tags)
  })
})

describe('toIdEntityId', () => {
  it('converts OSM element ids to the editor form', () => {
    expect(toIdEntityId('way/123')).toBe('w123')
    expect(toIdEntityId('node/9')).toBe('n9')
    expect(toIdEntityId('relation/45')).toBe('r45')
  })

  it('is null for anything else', () => {
    expect(toIdEntityId('w123')).toBeNull()
    expect(toIdEntityId('way/abc')).toBeNull()
  })
})

describe('tagFixes', () => {
  it('extracts tags to set', () => {
    const task = tagFixTask([
      modify('way/123', [{ operation: 'setTags', data: { surface: 'asphalt' } }]),
    ])
    expect(tagFixes(task)).toEqual([
      { elementId: 'way/123', entityId: 'w123', setTags: { surface: 'asphalt' }, unsetTags: [] },
    ])
  })

  it('extracts tags to unset', () => {
    const task = tagFixTask([modify('node/5', [{ operation: 'unsetTags', data: ['fixme'] }])])
    expect(tagFixes(task)[0]).toMatchObject({ entityId: 'n5', unsetTags: ['fixme'] })
  })

  it('coerces non-string tag values, since the format allows numbers', () => {
    const task = tagFixTask([modify('way/1', [{ operation: 'setTags', data: { lanes: 2 } }])])
    expect(tagFixes(task)[0].setTags).toEqual({ lanes: '2' })
  })

  it('covers several elements in one task', () => {
    const task = tagFixTask([
      modify('way/1', [{ operation: 'setTags', data: { a: '1' } }]),
      modify('way/2', [{ operation: 'setTags', data: { b: '2' } }]),
    ])
    expect(tagFixes(task).map((fix) => fix.entityId)).toEqual(['w1', 'w2'])
  })

  it('ignores create and delete operations, which a tag fix does not express', () => {
    const task = tagFixTask([
      { operationType: 'createElement', data: { id: 'way/1' } },
      { operationType: 'deleteElement', data: { id: 'way/2' } },
    ])
    expect(tagFixes(task)).toEqual([])
  })

  it('is empty for a change-file task', () => {
    const task = tagFixTask([modify('way/1', [{ operation: 'setTags', data: { a: '1' } }])], {
      version: 2,
      type: 2,
    })
    expect(tagFixes(task)).toEqual([])
  })

  it('is empty for an ordinary task', () => {
    expect(tagFixes({ id: 1 } as Task)).toEqual([])
    expect(isTagFixTask({ id: 1 } as Task)).toBe(false)
  })

  it('skips an operation that changes no tags', () => {
    expect(tagFixes(tagFixTask([modify('way/1', [])]))).toEqual([])
  })
})

describe('applyTagFix', () => {
  it('adds and overwrites tags, and removes the unset ones', () => {
    const fix = {
      elementId: 'way/1',
      entityId: 'w1',
      setTags: { surface: 'asphalt', lit: 'yes' },
      unsetTags: ['fixme'],
    }
    expect(applyTagFix({ highway: 'residential', surface: 'gravel', fixme: 'check' }, fix)).toEqual(
      {
        highway: 'residential',
        surface: 'asphalt',
        lit: 'yes',
      }
    )
  })

  it('leaves the original tags untouched', () => {
    const current = { a: '1' }
    applyTagFix(current, { elementId: 'w', entityId: 'w1', setTags: { b: '2' }, unsetTags: ['a'] })
    expect(current).toEqual({ a: '1' })
  })
})
