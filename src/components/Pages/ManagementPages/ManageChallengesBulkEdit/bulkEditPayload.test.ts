import { describe, expect, it } from 'vitest'
import { CHALLENGE_BASEMAP } from '@/components/Map/basemap'
import { TaskPriority } from '@/types/Priority'
import {
  BASEMAP_UNCHANGED,
  type BulkEditValues,
  buildChallengeBulkUpdate,
  buildPriorityUpdate,
  changedBulkEditFields,
  emptyBulkEditValues,
  normalizeKeywords,
} from './bulkEditPayload'

const values = (overrides: Partial<BulkEditValues> = {}): BulkEditValues => ({
  ...emptyBulkEditValues(),
  ...overrides,
})

describe('changedBulkEditFields', () => {
  it('reports nothing for an untouched form', () => {
    expect(changedBulkEditFields(emptyBulkEditValues())).toEqual([])
  })

  it('ignores whitespace-only text and empty keyword lists', () => {
    expect(
      changedBulkEditFields(
        values({ instruction: '   ', additionalKeywords: ' , ,', exportableProperties: ' ' })
      )
    ).toEqual([])
  })

  it('reports each field the user filled in', () => {
    expect(
      changedBulkEditFields(
        values({
          instruction: 'Fix it',
          additionalKeywords: 'roads',
          exportableProperties: 'name',
          basemap: 'none',
          dataOriginDate: '2024-03-01',
          replacePriorities: true,
        })
      )
    ).toEqual([
      'instruction',
      'additionalKeywords',
      'exportableProperties',
      'basemap',
      'dataOriginDate',
      'priorities',
    ])
  })
})

describe('normalizeKeywords', () => {
  it('trims keywords and drops empty ones', () => {
    expect(normalizeKeywords(' roads ,, bridges ,')).toBe('roads,bridges')
  })
})

describe('buildChallengeBulkUpdate', () => {
  it('sends nothing when nothing was filled in', () => {
    expect(buildChallengeBulkUpdate(emptyBulkEditValues(), ['highway', 'roads'])).toEqual({
      updates: {},
      removedKeywords: [],
    })
  })

  it('overwrites the instructions verbatim', () => {
    expect(buildChallengeBulkUpdate(values({ instruction: '# Fix\nit' }), []).updates).toEqual({
      instruction: '# Fix\nit',
    })
  })

  it("replaces additional keywords but keeps each challenge's own category keywords", () => {
    const update = buildChallengeBulkUpdate(values({ additionalKeywords: 'bridges, tunnels' }), [
      'highway',
      'roads',
    ])
    expect(update.updates.tags).toEqual(['highway', 'bridges', 'tunnels'])
    expect(update.removedKeywords).toEqual(['roads'])

    const water = buildChallengeBulkUpdate(values({ additionalKeywords: 'bridges' }), [
      'natural',
      'water',
      'coast',
    ])
    expect(water.updates.tags).toEqual(['natural', 'water', 'bridges'])
    expect(water.removedKeywords).toEqual(['coast'])
  })

  it('writes a named basemap, a custom one, or no override', () => {
    expect(buildChallengeBulkUpdate(values({ basemap: 'none' }), []).updates).toEqual({
      defaultBasemap: CHALLENGE_BASEMAP.none,
      defaultBasemapId: null,
      customBasemap: null,
    })
    expect(
      buildChallengeBulkUpdate(
        values({ basemap: 'custom', basemapUrl: ' https://tiles.example/{z}/{x}/{y}.png ' }),
        []
      ).updates
    ).toEqual({
      defaultBasemap: CHALLENGE_BASEMAP.custom,
      defaultBasemapId: null,
      customBasemap: 'https://tiles.example/{z}/{x}/{y}.png',
    })
    expect(buildChallengeBulkUpdate(values({ basemap: BASEMAP_UNCHANGED }), []).updates).toEqual({})
  })

  it('sends the data origin date as midnight UTC', () => {
    expect(
      buildChallengeBulkUpdate(values({ dataOriginDate: '2024-03-01' }), []).updates.dataOriginDate
    ).toBe(Date.UTC(2024, 2, 1))
  })

  it('trims exportable properties', () => {
    expect(
      buildChallengeBulkUpdate(values({ exportableProperties: ' name,ref ' }), []).updates
    ).toEqual({ exportableProperties: 'name,ref' })
  })
})

describe('buildPriorityUpdate', () => {
  const feature: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [1, 2] },
  }

  it("replaces the rules but keeps each challenge's own bounds", () => {
    const body = buildPriorityUpdate(
      {
        defaultPriority: TaskPriority.LOW,
        high: { key: 'surface', value: 'paved', operator: 'equals' },
        medium: null,
        low: null,
      },
      { highPriorityBounds: [feature], mediumPriorityBounds: null, lowPriorityBounds: [] }
    )
    expect(body.defaultPriority).toBe(TaskPriority.LOW)
    expect(JSON.parse(body.highPriorityRule)).toEqual({
      condition: 'AND',
      rules: [{ value: 'surface.paved', type: 'string', operator: 'equal' }],
    })
    expect(body.mediumPriorityRule).toBe('')
    expect(body.lowPriorityRule).toBe('')
    expect(JSON.parse(body.highPriorityBounds)).toEqual([feature])
    expect(body.mediumPriorityBounds).toBe('')
    expect(body.lowPriorityBounds).toBe('')
  })
})
