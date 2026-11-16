import type { Feature } from 'geojson'

/**
 * Feature styling from the data itself: the
 * [simplestyle](https://github.com/mapbox/simplestyle-spec) properties a
 * challenge's GeoJSON carries (`stroke`, `fill`, `marker-color`, …).
 *
 * MapRoulette 3 honored these too, which is how a task made of several
 * features showed each one in its own color.
 */

export interface ResolvedFeatureStyle {
  stroke?: string
  strokeWidth?: number
  strokeOpacity?: number
  fill?: string
  fillOpacity?: number
  markerColor?: string
}

const SIMPLESTYLE_PROPERTIES: Record<string, keyof ResolvedFeatureStyle> = {
  stroke: 'stroke',
  'stroke-width': 'strokeWidth',
  'stroke-opacity': 'strokeOpacity',
  fill: 'fill',
  'fill-opacity': 'fillOpacity',
  'marker-color': 'markerColor',
}

const COLOR_PATTERN = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgb|hsl)a?\([^)]*\)|[a-z]+)$/i

/**
 * Whether a value is a color MapLibre can parse. A paint expression carrying
 * an unparseable color throws at render time and takes the whole layer with
 * it, so anything questionable is dropped instead. Named colors are checked
 * against the browser itself where that is available.
 */
const asColor = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!COLOR_PATTERN.test(trimmed)) return undefined
  if (/^[a-z]+$/i.test(trimmed) && typeof CSS !== 'undefined' && CSS.supports) {
    return CSS.supports('color', trimmed) ? trimmed : undefined
  }
  return trimmed
}

const asNumberInRange = (value: unknown, min: number, max: number): number | undefined => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return undefined
  return parsed
}

const applyStyle = (
  style: ResolvedFeatureStyle,
  name: string,
  value: unknown
): ResolvedFeatureStyle => {
  const key = SIMPLESTYLE_PROPERTIES[name]
  if (!key) return style

  switch (key) {
    case 'stroke':
    case 'fill':
    case 'markerColor': {
      const color = asColor(value)
      return color ? { ...style, [key]: color } : style
    }
    case 'strokeWidth': {
      const width = asNumberInRange(value, 0.5, 40)
      return width === undefined ? style : { ...style, strokeWidth: width }
    }
    case 'strokeOpacity':
    case 'fillOpacity': {
      const opacity = asNumberInRange(value, 0, 1)
      return opacity === undefined ? style : { ...style, [key]: opacity }
    }
  }
}

/** The style to draw a feature with, from its own simplestyle properties. */
export const resolveFeatureStyle = (feature: Feature): ResolvedFeatureStyle => {
  let style: ResolvedFeatureStyle = {}
  for (const [name, value] of Object.entries(feature.properties ?? {})) {
    style = applyStyle(style, name, value)
  }
  return style
}
