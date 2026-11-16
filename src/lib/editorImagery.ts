import type { StyleSpecification } from 'maplibre-gl'

export interface EditorImagery {
  id?: string
  name: string
  url: string
  type: 'tms' | 'bing'
}

const KNOWN_IMAGERY: Record<string, Omit<EditorImagery, 'name' | 'url'> & { url?: string }> = {
  'OSM Carto': { id: 'MAPNIK', type: 'tms' },
  'Bing Aerial': { id: 'Bing', type: 'bing', url: 'https://www.bing.com/maps' },
  'Esri World Imagery': { id: 'EsriWorldImagery', type: 'tms' },
  'Esri World Imagery (Clarity)': { id: 'EsriWorldImageryClarity', type: 'tms' },
}

const rasterTileUrl = (style: StyleSpecification): string | undefined => {
  for (const source of Object.values(style.sources ?? {})) {
    if (source.type === 'raster' && source.tiles?.[0]) return source.tiles[0]
  }
  return undefined
}

export const editorImageryForStyle = (
  style: StyleSpecification | null | undefined
): EditorImagery | null => {
  if (!style?.name) return null
  const tileUrl = rasterTileUrl(style)
  const known = KNOWN_IMAGERY[style.name]
  if (known) {
    const url = known.url ?? tileUrl
    return url ? { ...known, name: style.name, url } : null
  }
  return tileUrl ? { name: style.name, url: tileUrl, type: 'tms' } : null
}

export const editorBackgroundParam = (imagery: EditorImagery): string =>
  `background=${imagery.id ?? `custom:${encodeURIComponent(imagery.url)}`}`

export const josmImageryCommand = (josmHost: string, imagery: EditorImagery): string =>
  `${josmHost}imagery?${[
    imagery.id ? `id=${imagery.id}` : null,
    `title=${encodeURIComponent(imagery.name)}`,
    `type=${imagery.type}`,
    `url=${encodeURIComponent(imagery.url)}`,
  ]
    .filter(Boolean)
    .join('&')}`
