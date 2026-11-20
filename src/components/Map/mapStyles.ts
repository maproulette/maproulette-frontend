import type { StyleSpecification } from 'maplibre-gl'
import { z } from 'zod'
import { localStored } from '@/lib/storage'
import BingAerial from './bing-aerial.json'
import { customBaseLayerStyles } from './customBaseLayers'
import EsriWorldImagery from './esri-world-imagery.json'
import EsriWorldImageryClarity from './esri-world-imagery-clarity.json'
import OsmBright from './osm-bright.json'
import OsmCarto from './osm-carto.json'

// Raster basemap styles don't include a glyphs URL, but we need glyphs to
// render MapRoulette's overlay layer with task and cluster markers.
export const OVERLAY_GLYPHS_URL = 'https://tiles.openstreetmap.us/fonts/{fontstack}/{range}.pbf'

const asStyle = (s: unknown) => s as StyleSpecification

/** Base layers bundled with the frontend, in the order the control shows them. */
export const bundledMapStyles: StyleSpecification[] = [
  asStyle(OsmBright),
  asStyle(OsmCarto),
  asStyle(BingAerial),
  asStyle(EsriWorldImagery),
  asStyle(EsriWorldImageryClarity),
]

/**
 * Every base layer on offer: the bundled ones plus any the user has added
 * themselves. Read as a function of current storage rather than a frozen
 * array, so a layer added during the session is immediately selectable.
 */
export const allMapStyles = (): StyleSpecification[] => [
  ...bundledMapStyles,
  ...customBaseLayerStyles(),
]

const savedStyleName = localStored('map.style', z.string().nullable(), null)

export const getCurrentMapStyleIndex = (): number => {
  const saved = savedStyleName.get()
  const i = allMapStyles().findIndex((s) => s.name === saved)
  return i >= 0 ? i : 0
}

export const saveMapStyle = (index: number) => {
  const name = allMapStyles()[index]?.name
  if (name) savedStyleName.set(name)
}

export const getCurrentMapStyle = () =>
  allMapStyles()[getCurrentMapStyleIndex()] ?? bundledMapStyles[0]
