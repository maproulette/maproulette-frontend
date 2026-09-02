import { describe, expect, it } from 'vitest'
import {
  basemapSelection,
  basemapStyle,
  basemapSubmission,
  bundledStyleNames,
  CHALLENGE_BASEMAP,
  resolveMapStyle,
} from './basemap.ts'
import { customRasterStyle } from './customBaseLayers.ts'
import { getCurrentMapStyle } from './mapStyles.ts'

describe('basemapStyle', () => {
  it('is no override when the challenge or user expresses no preference', () => {
    expect(basemapStyle({})).toBeNull()
    expect(basemapStyle({ defaultBasemap: null })).toBeNull()
    expect(basemapStyle({ defaultBasemap: CHALLENGE_BASEMAP.none })).toBeNull()
  })

  it('maps the OpenStreetMap and Bing constants onto bundled styles', () => {
    expect(basemapStyle({ defaultBasemap: CHALLENGE_BASEMAP.openStreetMap })?.name).toBe(
      'OSM Carto'
    )
    expect(basemapStyle({ defaultBasemap: CHALLENGE_BASEMAP.bing })?.name).toBe('Bing Aerial')
  })

  it('is no override for imagery this build does not bundle', () => {
    expect(basemapStyle({ defaultBasemap: CHALLENGE_BASEMAP.openCycleMap })).toBeNull()
  })

  it('resolves a named style for the identified constant', () => {
    const settings = {
      defaultBasemap: CHALLENGE_BASEMAP.identified,
      defaultBasemapId: 'Esri World Imagery',
    }
    expect(basemapStyle(settings)?.name).toBe('Esri World Imagery')
  })

  it('is no override when the identified style is not bundled', () => {
    const settings = { defaultBasemap: CHALLENGE_BASEMAP.identified, defaultBasemapId: 'tf-cycle' }
    expect(basemapStyle(settings)).toBeNull()
  })

  it('builds a raster style from a challenge custom tile template', () => {
    const settings = {
      defaultBasemap: CHALLENGE_BASEMAP.custom,
      customBasemap: 'https://example.org/tile/{z}/{x}/{y}',
    }
    const style = basemapStyle(settings)
    expect(style?.sources.custom).toMatchObject({
      type: 'raster',
      tiles: ['https://example.org/tile/{z}/{x}/{y}'],
    })
  })

  it("falls back to defaultBasemapId for a user's custom tile template", () => {
    const settings = {
      defaultBasemap: CHALLENGE_BASEMAP.custom,
      defaultBasemapId: 'https://example.org/u/{z}/{x}/{y}',
    }
    expect(basemapStyle(settings)?.sources.custom).toMatchObject({
      tiles: ['https://example.org/u/{z}/{x}/{y}'],
    })
  })

  it('is no override when custom is selected but no URL was given', () => {
    expect(basemapStyle({ defaultBasemap: CHALLENGE_BASEMAP.custom })).toBeNull()
  })
})

describe('customRasterStyle', () => {
  it('produces a valid single-layer raster style', () => {
    const style = customRasterStyle('https://example.org/{z}/{x}/{y}', 'Challenge Default')
    expect(style.version).toBe(8)
    expect(style.name).toBe('Challenge Default')
    expect(style.layers).toEqual([{ id: 'custom', type: 'raster', source: 'custom' }])
  })
})

describe('resolveMapStyle', () => {
  const challenge = { defaultBasemap: CHALLENGE_BASEMAP.bing }
  const userSettings = { defaultBasemap: CHALLENGE_BASEMAP.openStreetMap }

  it("prefers the challenge's basemap over the user's default", () => {
    expect(resolveMapStyle(challenge, userSettings).name).toBe('Bing Aerial')
  })

  it("falls back to the user's default when the challenge sets none", () => {
    expect(resolveMapStyle({ defaultBasemap: CHALLENGE_BASEMAP.none }, userSettings).name).toBe(
      'OSM Carto'
    )
  })

  it('falls back to the last-picked style when neither expresses a preference', () => {
    expect(resolveMapStyle(null, null).name).toBe(getCurrentMapStyle().name)
  })
})

describe('basemapSelection', () => {
  it('is none for a challenge with no basemap set', () => {
    expect(basemapSelection(null)).toBe('none')
    expect(basemapSelection({})).toBe('none')
    expect(basemapSelection({ defaultBasemap: CHALLENGE_BASEMAP.none })).toBe('none')
  })

  it('is the style name for an identified basemap', () => {
    const challenge = {
      defaultBasemap: CHALLENGE_BASEMAP.identified,
      defaultBasemapId: 'Esri World Imagery',
    }
    expect(basemapSelection(challenge)).toBe('Esri World Imagery')
  })

  it('resolves an MR3 numeric constant to the bundled style it maps onto', () => {
    expect(basemapSelection({ defaultBasemap: CHALLENGE_BASEMAP.bing })).toBe('Bing Aerial')
  })

  it('is custom when a tile template is stored', () => {
    const challenge = {
      defaultBasemap: CHALLENGE_BASEMAP.custom,
      customBasemap: 'https://example.org/{z}/{x}/{y}',
    }
    expect(basemapSelection(challenge)).toBe('custom')
  })
})

describe('basemapSubmission', () => {
  it('stores a named style with the identified constant', () => {
    expect(basemapSubmission('Bing Aerial', '')).toEqual({
      defaultBasemap: CHALLENGE_BASEMAP.identified,
      defaultBasemapId: 'Bing Aerial',
      customBasemap: null,
    })
  })

  it('stores a custom tile template', () => {
    expect(basemapSubmission('custom', 'https://example.org/{z}/{x}/{y}')).toEqual({
      defaultBasemap: CHALLENGE_BASEMAP.custom,
      defaultBasemapId: null,
      customBasemap: 'https://example.org/{z}/{x}/{y}',
    })
  })

  it('clears the basemap for none, and for custom with no URL typed', () => {
    const cleared = {
      defaultBasemap: CHALLENGE_BASEMAP.none,
      defaultBasemapId: null,
      customBasemap: null,
    }
    expect(basemapSubmission('none', '')).toEqual(cleared)
    expect(basemapSubmission('custom', '')).toEqual(cleared)
    expect(basemapSubmission('Not A Bundled Style', '')).toEqual(cleared)
  })

  it('round-trips a selection back through basemapSelection', () => {
    for (const name of bundledStyleNames()) {
      expect(basemapSelection(basemapSubmission(name, ''))).toBe(name)
    }
    expect(basemapSelection(basemapSubmission('custom', 'https://e.org/{z}/{x}/{y}'))).toBe(
      'custom'
    )
    expect(basemapSelection(basemapSubmission('none', ''))).toBe('none')
  })
})
