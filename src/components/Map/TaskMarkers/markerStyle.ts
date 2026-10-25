import type { TaskMarker } from '@/types/Task'

export interface MarkerStyle {
  icon: string
  opacity: number
  size: number
}

export type MarkerEmphasis =
  | 'primary'
  | 'bundled'
  | 'bundled-selected'
  | 'selected'
  | 'lasso'
  | 'lasso-selected'
  | 'hovered'

export interface HighlightedMarker {
  marker: TaskMarker
  style: MarkerStyle
}

const WORKABLE_STATUSES = new Set([0, 3, 6])

export const statusPinIcon = (
  marker: Pick<TaskMarker, 'status' | 'priority'>,
  emphasis?: MarkerEmphasis
): string =>
  `marker-pin-${marker.status ?? 0}-${marker.priority ?? 1}${emphasis ? `-${emphasis}` : ''}`

export const statusPinStyle = (marker: TaskMarker): MarkerStyle => ({
  icon: statusPinIcon(marker),
  opacity: WORKABLE_STATUSES.has(marker.status) ? 1 : 0.4,
  size: 1,
})

export const emphasizedPinStyle = (marker: TaskMarker, emphasis: MarkerEmphasis): MarkerStyle => ({
  icon: statusPinIcon(marker, emphasis),
  opacity: 1,
  size: emphasis === 'lasso' ? 1 : 1.4,
})
