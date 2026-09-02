import { describe, expect, it } from 'vitest'
import { tagChanges, tagsFromOsmElement } from './tagDiff.ts'

describe('tagChanges', () => {
  it('reports a tag the element does not have as added', () => {
    expect(tagChanges({}, { setTags: { surface: 'asphalt' }, unsetTags: [] })).toEqual([
      { key: 'surface', from: null, to: 'asphalt', status: 'added' },
    ])
  })

  it('reports a different value as changed, keeping the old one', () => {
    expect(
      tagChanges({ surface: 'gravel' }, { setTags: { surface: 'asphalt' }, unsetTags: [] })
    ).toEqual([{ key: 'surface', from: 'gravel', to: 'asphalt', status: 'changed' }])
  })

  it('reports an unset tag as removed', () => {
    expect(tagChanges({ fixme: 'check' }, { setTags: {}, unsetTags: ['fixme'] })).toEqual([
      { key: 'fixme', from: 'check', to: null, status: 'removed' },
    ])
  })

  it('says nothing about a value the element already has', () => {
    expect(
      tagChanges({ surface: 'asphalt' }, { setTags: { surface: 'asphalt' }, unsetTags: [] })
    ).toEqual([])
  })

  it('says nothing about unsetting a tag that is not there', () => {
    expect(tagChanges({}, { setTags: {}, unsetTags: ['fixme'] })).toEqual([])
  })

  it('leaves untouched tags out entirely', () => {
    const current = { highway: 'tertiary', name: 'West 33rd Street', surface: 'gravel' }
    const changes = tagChanges(current, { setTags: { surface: 'asphalt' }, unsetTags: [] })
    expect(changes.map((change) => change.key)).toEqual(['surface'])
  })

  it('sorts by key so the list is stable between renders', () => {
    const changes = tagChanges({}, { setTags: { zebra: '1', alpha: '2' }, unsetTags: ['middle'] })
    expect(changes.map((change) => change.key)).toEqual(['alpha', 'zebra'])
  })
})

describe('tagsFromOsmElement', () => {
  it('reads a list of tags', () => {
    const element = {
      tag: [
        { k: 'highway', v: 'tertiary' },
        { k: 'surface', v: 'gravel' },
      ],
    }
    expect(tagsFromOsmElement(element)).toEqual({ highway: 'tertiary', surface: 'gravel' })
  })

  it('reads a lone tag, which is not wrapped in an array', () => {
    expect(tagsFromOsmElement({ tag: { k: 'highway', v: 'tertiary' } })).toEqual({
      highway: 'tertiary',
    })
  })

  it('coerces numeric values back to strings', () => {
    expect(tagsFromOsmElement({ tag: { k: 'lanes', v: 2 } })).toEqual({ lanes: '2' })
  })

  it('is empty for an element with no tags or no element at all', () => {
    expect(tagsFromOsmElement({})).toEqual({})
    expect(tagsFromOsmElement(null)).toEqual({})
  })
})
