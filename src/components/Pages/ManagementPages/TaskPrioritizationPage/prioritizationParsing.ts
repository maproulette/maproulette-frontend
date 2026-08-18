import { backendJsonToBinary } from '@/components/shared/TaskPropertyQueryBuilder/backendRuleShape'
import type { BinaryNode } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import { logger } from '@/lib/logger'
import type { PrioritizationDraft, Tier } from './PrioritizationContext'

/**
 * Parse a raw server-stored bounds string into a FeatureCollection.
 * Accepts either a FeatureCollection or a GeoJSON feature array (MR3 format).
 */
// The backend serializes priority bounds inconsistently — the save endpoint
// accepts a JSON string, but the challenge GET response returns the parsed
// array (or null). Accept anything we might encounter so the draft re-init
// after a save round-trip doesn't silently drop the bounds and reset the
// preview to all-default.
export const parseBoundsString = (raw: unknown): GeoJSON.FeatureCollection | null => {
  if (raw == null) return null
  let parsed: unknown
  if (typeof raw === 'string') {
    if (raw.length === 0) return null
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      logger.warn('Could not parse priority bounds string', { error })
      return null
    }
  } else {
    parsed = raw
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return null
    return { type: 'FeatureCollection', features: parsed as GeoJSON.Feature[] }
  }
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as { type?: string }
    if (obj.type === 'FeatureCollection') {
      return parsed as GeoJSON.FeatureCollection
    }
    if (obj.type === 'Feature') {
      return { type: 'FeatureCollection', features: [parsed as GeoJSON.Feature] }
    }
  }
  return null
}

// The backend stores rules in its own JSON shape (see backendRuleShape.ts)
// — `{condition, rules: [...]}` with dot-joined `key.value` leaves — while
// the editor works in our `BinaryNode` tree. Translate on the way in so the
// editor sees a shape it understands.
export const parseRulesString = (raw: unknown): BinaryNode | null => backendJsonToBinary(raw)

export const draftsEqual = (a: PrioritizationDraft, b: PrioritizationDraft): boolean => {
  if (a.defaultPriority !== b.defaultPriority) return false
  for (const tier of ['high', 'medium', 'low'] as Tier[]) {
    if (JSON.stringify(a[tier].rules) !== JSON.stringify(b[tier].rules)) return false
    if (JSON.stringify(a[tier].bounds) !== JSON.stringify(b[tier].bounds)) return false
  }
  return true
}
