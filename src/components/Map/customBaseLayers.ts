import type { StyleSpecification } from 'maplibre-gl'

/**
 * A minimal raster style for a caller-supplied XYZ tile template, so a
 * challenge or user can point the map at imagery we don't bundle. `{z}/{x}/{y}`
 * is MapLibre's own placeholder syntax, so the template is used as given.
 */
export const customRasterStyle = (url: string, name = 'Custom'): StyleSpecification => ({
  version: 8,
  name,
  sources: {
    custom: { type: 'raster', tiles: [url], tileSize: 256 },
  },
  layers: [{ id: 'custom', type: 'raster', source: 'custom' }],
})

const STORAGE_KEY = 'mr4:map:customBaseLayers'

export type CustomLayerType = 'xyz' | 'wms'

export interface CustomBaseLayer {
  id: string
  name: string
  type: CustomLayerType
  /** XYZ tile template, or the WMS endpoint URL. */
  url: string
  /** WMS only: comma-separated layer names to request. */
  layers?: string
  attribution?: string
}

/**
 * Turn a WMS endpoint into a tile template MapLibre can request. MapLibre
 * substitutes `{bbox-epsg-3857}` per tile, so a WMS layer is just a raster
 * source with a fully-formed GetMap URL.
 */
export const wmsTileUrl = (endpoint: string, layers: string): string => {
  const separator = endpoint.includes('?') ? '&' : '?'
  const params = new URLSearchParams({
    service: 'WMS',
    request: 'GetMap',
    version: '1.1.1',
    layers,
    format: 'image/png',
    transparent: 'true',
    srs: 'EPSG:3857',
    width: '256',
    height: '256',
  })
  // bbox is appended raw: MapLibre's placeholder must not be URL-encoded.
  return `${endpoint}${separator}${params.toString()}&bbox={bbox-epsg-3857}`
}

/** The MapLibre style document for a custom base layer. */
export const customBaseLayerStyle = (layer: CustomBaseLayer): StyleSpecification => {
  const url = layer.type === 'wms' ? wmsTileUrl(layer.url, layer.layers ?? '') : layer.url
  const style = customRasterStyle(url, layer.name)
  if (layer.attribution) {
    const source = style.sources.custom as { attribution?: string }
    source.attribution = layer.attribution
  }
  return style
}

const readStored = (): CustomBaseLayer[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((l) => l?.id && l?.name && l?.url) : []
  } catch {
    return []
  }
}

const writeStored = (layers: CustomBaseLayer[]): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layers))
  } catch {
    // A private window may refuse to store; the layer still works this session.
  }
}

export const getCustomBaseLayers = (): CustomBaseLayer[] => readStored()

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `layer-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

export const addCustomBaseLayer = (layer: Omit<CustomBaseLayer, 'id'>): CustomBaseLayer => {
  const created = { ...layer, id: newId() }
  writeStored([...readStored(), created])
  return created
}

export const removeCustomBaseLayer = (id: string): void => {
  writeStored(readStored().filter((layer) => layer.id !== id))
}

/** Styles for every custom base layer, for appending to the bundled list. */
export const customBaseLayerStyles = (): StyleSpecification[] =>
  getCustomBaseLayers().map(customBaseLayerStyle)
