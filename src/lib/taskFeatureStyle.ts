import type { Feature } from 'geojson'
import type {
  TaskPropertySearch,
  TaskStyleRule,
} from '@/components/Map/FeatureStyleLegend/styleRuleToText'

/**
 * Feature styling from the data itself: the
 * [simplestyle](https://github.com/mapbox/simplestyle-spec) properties a
 * challenge's GeoJSON carries (`stroke`, `fill`, `marker-color`, …), plus any
 * conditional style rules configured on the challenge, which win over them.
 *
 * MapRoulette 3 honored both, which is how a task made of several features
 * showed each one in its own color.
 */

export interface ResolvedFeatureStyle {
  stroke?: string
  strokeWidth?: number
  strokeOpacity?: number
  fill?: string
  fillOpacity?: number
  markerColor?: string
}

/** Simplestyle names, and the camelCase spellings challenge rules also use. */
const STYLE_ALIASES: Record<string, keyof ResolvedFeatureStyle> = {
  stroke: 'stroke',
  strokeColor: 'stroke',
  'stroke-width': 'strokeWidth',
  strokeWidth: 'strokeWidth',
  'stroke-opacity': 'strokeOpacity',
  strokeOpacity: 'strokeOpacity',
  fill: 'fill',
  fillColor: 'fill',
  'fill-opacity': 'fillOpacity',
  fillOpacity: 'fillOpacity',
  opacity: 'fillOpacity',
  'marker-color': 'markerColor',
  markerColor: 'markerColor',
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
  const key = STYLE_ALIASES[name]
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

const compare = (left: unknown, right: unknown, operation: string): boolean => {
  const leftNumber = Number.parseFloat(String(left))
  const rightNumber = Number.parseFloat(String(right))
  const numeric = Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
  const a = numeric ? leftNumber : String(left ?? '')
  const b = numeric ? rightNumber : String(right ?? '')

  switch (operation) {
    case 'greaterThan':
      return a > b
    case 'greaterThanOrEqual':
      return a >= b
    case 'lessThan':
      return a < b
    case 'lessThanOrEqual':
      return a <= b
    default:
      return false
  }
}

/** Whether a feature's properties satisfy one of a challenge's style filters. */
export const matchesPropertySearch = (
  properties: Record<string, unknown>,
  search: TaskPropertySearch | undefined
): boolean => {
  if (!search) return false

  if (search.left && search.right) {
    const left = matchesPropertySearch(properties, search.left)
    const right = matchesPropertySearch(properties, search.right)
    return search.condition === 'or' ? left || right : left && right
  }

  if (!search.key) return false
  const present = Object.hasOwn(properties, search.key)
  const actual = properties[search.key]

  switch (search.operationType ?? 'equals') {
    case 'exists':
      return present
    case 'missing':
      return !present
    case 'equals':
      return present && String(actual) === String(search.value)
    case 'notEqual':
      return !present || String(actual) !== String(search.value)
    case 'contains':
      return present && String(actual).includes(String(search.value))
    default:
      return present && compare(actual, search.value, search.operationType ?? '')
  }
}

/** Reads a challenge's `taskStyles`, dropping anything not shaped like a rule. */
export const parseStyleRules = (value: unknown): TaskStyleRule[] => {
  if (!Array.isArray(value)) return []
  return value.filter((rule): rule is TaskStyleRule => {
    if (typeof rule !== 'object' || rule === null) return false
    const candidate = rule as { propertySearch?: unknown; styles?: unknown }
    return (
      typeof candidate.propertySearch === 'object' &&
      candidate.propertySearch !== null &&
      Array.isArray(candidate.styles)
    )
  })
}

/**
 * The style to draw a feature with: its own simplestyle properties, with any
 * matching challenge style rules layered on top.
 */
export const resolveFeatureStyle = (
  feature: Feature,
  styleRules: TaskStyleRule[] = []
): ResolvedFeatureStyle => {
  const properties = (feature.properties ?? {}) as Record<string, unknown>

  let style: ResolvedFeatureStyle = {}
  for (const [name, value] of Object.entries(properties)) {
    style = applyStyle(style, name, value)
  }

  for (const rule of styleRules) {
    if (!matchesPropertySearch(properties, rule.propertySearch)) continue
    for (const { styleName, styleValue } of rule.styles) {
      style = applyStyle(style, styleName, styleValue)
    }
  }

  return style
}
