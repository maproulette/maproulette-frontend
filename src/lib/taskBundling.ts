import { isLineByLineGeoJSONText, isNewlineDelimitedGeoJSONText } from './localGeoJSON'

export type GeoJSONFeature = {
  type?: string
  geometry?: unknown
  properties?: Record<string, unknown> | null
}

const RECORD_SEPARATOR = 0x1e

const stripRecordSeparator = (line: string) => {
  let start = 0
  while (line.charCodeAt(start) === RECORD_SEPARATOR) start += 1
  return line.slice(start)
}

const featuresOf = (document: unknown): GeoJSONFeature[] => {
  if (document === null || typeof document !== 'object') {
    throw new Error('GeoJSON must be a Feature or a FeatureCollection')
  }

  const candidate = document as { type?: unknown; features?: unknown }
  if (candidate.type === 'FeatureCollection') {
    return Array.isArray(candidate.features) ? (candidate.features as GeoJSONFeature[]) : []
  }
  if (candidate.type === 'Feature') {
    return [document as GeoJSONFeature]
  }

  throw new Error(`Unsupported GeoJSON type "${String(candidate.type)}"`)
}

export const featuresFromGeoJSONText = (text: string): GeoJSONFeature[] => {
  if (isLineByLineGeoJSONText(text) || isNewlineDelimitedGeoJSONText(text)) {
    return text
      .split('\n')
      .map((line) => stripRecordSeparator(line).trim())
      .filter((line) => line.length > 0)
      .flatMap((line) => featuresOf(JSON.parse(line)))
  }

  return featuresOf(JSON.parse(text))
}

export const groupFeaturesByProperty = (
  features: GeoJSONFeature[],
  property: string
): GeoJSONFeature[][] => {
  const groups: GeoJSONFeature[][] = []
  const groupIndexByBundleId = new Map<string, number>()

  for (const feature of features) {
    const bundleId = feature?.properties?.[property]

    if (bundleId === undefined || bundleId === null || bundleId === '') {
      groups.push([feature])
      continue
    }

    const key = String(bundleId)
    const existingIndex = groupIndexByBundleId.get(key)
    if (existingIndex === undefined) {
      groupIndexByBundleId.set(key, groups.length)
      groups.push([feature])
    } else {
      groups[existingIndex].push(feature)
    }
  }

  return groups
}

export const bundleGeoJSONText = (text: string, property: string): string =>
  groupFeaturesByProperty(featuresFromGeoJSONText(text), property)
    .map((features) => JSON.stringify({ type: 'FeatureCollection', features }))
    .join('\n')

export const bundledGeoJSONFile = (text: string, property: string, fileName: string): File =>
  new File([bundleGeoJSONText(text, property)], fileName, { type: 'application/json' })
