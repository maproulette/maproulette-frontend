/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addCustomBaseLayer,
  customBaseLayerStyle,
  getCustomBaseLayers,
  removeCustomBaseLayer,
  wmsTileUrl,
} from './customBaseLayers.ts'

beforeEach(() => {
  localStorage.clear()
})

describe('wmsTileUrl', () => {
  it('builds a GetMap request MapLibre can fill in per tile', () => {
    const url = wmsTileUrl('https://example.org/wms', 'workspace:layer')
    expect(url).toContain('service=WMS')
    expect(url).toContain('request=GetMap')
    expect(url).toContain('layers=workspace%3Alayer')
    // The bbox placeholder must survive un-encoded for MapLibre to replace it.
    expect(url).toContain('&bbox={bbox-epsg-3857}')
  })

  it('appends to an endpoint that already carries a query string', () => {
    expect(wmsTileUrl('https://example.org/wms?map=a', 'x')).toContain('?map=a&service=WMS')
  })
})

describe('customBaseLayerStyle', () => {
  it('uses an XYZ template as given', () => {
    const style = customBaseLayerStyle({
      id: '1',
      name: 'Mine',
      type: 'xyz',
      url: 'https://example.org/{z}/{x}/{y}.png',
    })
    expect(style.name).toBe('Mine')
    expect(style.sources.custom).toMatchObject({
      tiles: ['https://example.org/{z}/{x}/{y}.png'],
    })
  })

  it('builds a WMS request for a WMS layer', () => {
    const style = customBaseLayerStyle({
      id: '1',
      name: 'WMS',
      type: 'wms',
      url: 'https://example.org/wms',
      layers: 'a',
    })
    const source = style.sources.custom as { tiles: string[] }
    expect(source.tiles[0]).toContain('request=GetMap')
  })

  it('carries attribution onto the source when given', () => {
    const style = customBaseLayerStyle({
      id: '1',
      name: 'Mine',
      type: 'xyz',
      url: 'https://example.org/{z}/{x}/{y}',
      attribution: '© Someone',
    })
    expect(style.sources.custom).toMatchObject({ attribution: '© Someone' })
  })
})

describe('storage', () => {
  it('round-trips added layers', () => {
    const created = addCustomBaseLayer({
      name: 'Mine',
      type: 'xyz',
      url: 'https://e.org/{z}/{x}/{y}',
    })
    expect(created.id).toBeTruthy()
    expect(getCustomBaseLayers()).toHaveLength(1)
    expect(getCustomBaseLayers()[0].name).toBe('Mine')
  })

  it('removes by id and leaves the others', () => {
    const a = addCustomBaseLayer({ name: 'A', type: 'xyz', url: 'https://e.org/a/{z}/{x}/{y}' })
    addCustomBaseLayer({ name: 'B', type: 'xyz', url: 'https://e.org/b/{z}/{x}/{y}' })
    removeCustomBaseLayer(a.id)
    expect(getCustomBaseLayers().map((l) => l.name)).toEqual(['B'])
  })

  it('ignores stored junk rather than throwing', () => {
    localStorage.setItem('mr4:map:customBaseLayers', 'not json')
    expect(getCustomBaseLayers()).toEqual([])
    localStorage.setItem('mr4:map:customBaseLayers', '[{"name":"no id or url"}]')
    expect(getCustomBaseLayers()).toEqual([])
  })
})
