import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import { workspaceProperties } from './workspaceProperties.ts'

const makeTask = (properties: Record<string, unknown> = {}, id = 141443): Task =>
  ({
    id,
    geometries: { type: 'FeatureCollection', features: [{ type: 'Feature', properties }] },
  }) as unknown as Task

describe('workspaceProperties', () => {
  it('always provides the MapRoulette task id', () => {
    expect(workspaceProperties(makeTask())['#mrTaskId']).toBe('141443')
  })

  it('reads the OSM type and id from a combined @id', () => {
    const properties = workspaceProperties(makeTask({ '@id': 'way/1234' }))
    expect(properties['#osmType']).toBe('way')
    expect(properties['#osmId']).toBe('1234')
  })

  it('reads them from separate properties', () => {
    const properties = workspaceProperties(makeTask({ osmType: 'node', osmid: 99 }))
    expect(properties['#osmType']).toBe('node')
    expect(properties['#osmId']).toBe('99')
  })

  it('omits the OSM identity when it cannot be worked out', () => {
    const properties = workspaceProperties(makeTask({ highway: 'primary' }))
    expect(properties['#osmType']).toBeUndefined()
    expect(properties['#osmId']).toBeUndefined()
  })

  it('derives every map property from the viewport', () => {
    const properties = workspaceProperties(makeTask(), {
      bounds: [-1, 50, 1, 52],
      zoom: 14.7,
    })
    expect(properties['#mapBBox']).toBe('-1,50,1,52')
    expect(properties['#mapWest']).toBe('-1')
    expect(properties['#mapSouth']).toBe('50')
    expect(properties['#mapEast']).toBe('1')
    expect(properties['#mapNorth']).toBe('52')
    expect(properties['#mapLat']).toBe('51')
    expect(properties['#mapLon']).toBe('0')
    expect(properties['#mapZoom']).toBe('14')
  })

  it('omits map properties when there is no map on screen', () => {
    const properties = workspaceProperties(makeTask())
    for (const key of ['#mapBBox', '#mapZoom', '#mapLat', '#mapLon']) {
      expect(properties[key]).toBeUndefined()
    }
  })

  it('ignores a viewport with non-finite bounds rather than emitting NaN', () => {
    const properties = workspaceProperties(makeTask(), {
      bounds: [Number.NaN, 50, 1, 52],
      zoom: null,
    })
    expect(properties['#mapBBox']).toBeUndefined()
  })
})
