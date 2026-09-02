import type { StyleSpecification } from 'maplibre-gl'
import { getCurrentMapStyle, mapStyles } from './mapStyles'

/**
 * The backend's basemap constants, stored on a challenge (`defaultBasemap`) and
 * on a user's settings. `none` means "no override" rather than "no map".
 */
export const CHALLENGE_BASEMAP = {
  none: -1,
  openStreetMap: 0,
  openCycleMap: 1,
  bing: 2,
  custom: 3,
  identified: 4,
} as const

/**
 * Which bundled MapLibre style each constant selects. MapRoulette no longer
 * pulls layers from the OSM editor layer index, so the constants map onto the
 * closest style shipped with the frontend. OpenCycleMap has no bundled
 * equivalent and is deliberately absent — it resolves to no override.
 */
const STYLE_NAME_FOR_BASEMAP: Record<number, string> = {
  [CHALLENGE_BASEMAP.openStreetMap]: 'OSM Carto',
  [CHALLENGE_BASEMAP.bing]: 'Bing Aerial',
}

/** The bundled style with this name, if there is one. */
export const styleByName = (name: string | null | undefined): StyleSpecification | undefined =>
  name ? mapStyles.find((style) => style.name === name) : undefined

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

interface BasemapSettings {
  defaultBasemap?: number | null
  defaultBasemapId?: string | null
  customBasemap?: string | null
}

/**
 * The style a challenge's or user's stored basemap selects, or null when they
 * express no preference (or name imagery this build doesn't have).
 */
export const basemapStyle = ({
  defaultBasemap,
  defaultBasemapId,
  customBasemap,
}: BasemapSettings): StyleSpecification | null => {
  if (defaultBasemap === null || defaultBasemap === undefined) return null
  if (defaultBasemap === CHALLENGE_BASEMAP.none) return null

  if (defaultBasemap === CHALLENGE_BASEMAP.identified) {
    return styleByName(defaultBasemapId) ?? null
  }

  if (defaultBasemap === CHALLENGE_BASEMAP.custom) {
    // MR3 stored the tile template in `customBasemap` on a challenge but in
    // `defaultBasemapId` on a user's settings, so accept either.
    const url = customBasemap || defaultBasemapId
    return url ? customRasterStyle(url) : null
  }

  return styleByName(STYLE_NAME_FOR_BASEMAP[defaultBasemap]) ?? null
}

/**
 * The style a map should open on: a challenge's basemap wins, then the user's
 * account default, then whichever style they last picked with the Map style
 * control. Mirrors MR3's `WithVisibleLayer.defaultLayer`.
 */
export const resolveMapStyle = (
  challenge?: BasemapSettings | null,
  userSettings?: BasemapSettings | null
): StyleSpecification =>
  (challenge ? basemapStyle(challenge) : null) ??
  (userSettings ? basemapStyle(userSettings) : null) ??
  getCurrentMapStyle()

/** Form selection meaning "let the mapper's own preference win". */
export const BASEMAP_NONE = 'none'
/** Form selection meaning "use the tile template typed alongside it". */
export const BASEMAP_CUSTOM = 'custom'

/** Names of the bundled styles, in the order the Map style control shows them. */
export const bundledStyleNames = (): string[] =>
  mapStyles.map((style) => style.name).filter((name): name is string => !!name)

/**
 * The challenge form's basemap selection for a stored challenge: a bundled
 * style's name, `custom`, or `none`. Challenges created by MR3 store numeric
 * constants, which resolve to the bundled style they map onto.
 */
export const basemapSelection = (challenge: BasemapSettings | null | undefined): string => {
  if (!challenge) return BASEMAP_NONE
  const { defaultBasemap, defaultBasemapId, customBasemap } = challenge
  if (defaultBasemap === CHALLENGE_BASEMAP.custom && (customBasemap || defaultBasemapId)) {
    return BASEMAP_CUSTOM
  }
  return basemapStyle(challenge)?.name ?? BASEMAP_NONE
}

/**
 * The challenge fields a form selection writes back. A named style is stored
 * with the `identified` constant so the exact style survives the round trip
 * rather than being squeezed into MR3's three-value vocabulary.
 */
export const basemapSubmission = (
  selection: string,
  customBasemapUrl: string
): Required<BasemapSettings> => {
  if (selection === BASEMAP_CUSTOM && customBasemapUrl) {
    return {
      defaultBasemap: CHALLENGE_BASEMAP.custom,
      defaultBasemapId: null,
      customBasemap: customBasemapUrl,
    }
  }
  if (selection !== BASEMAP_NONE && selection !== BASEMAP_CUSTOM && styleByName(selection)) {
    return {
      defaultBasemap: CHALLENGE_BASEMAP.identified,
      defaultBasemapId: selection,
      customBasemap: null,
    }
  }
  return { defaultBasemap: CHALLENGE_BASEMAP.none, defaultBasemapId: null, customBasemap: null }
}
