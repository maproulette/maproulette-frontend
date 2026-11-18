import { AlertTriangle, Check, CircleHelp, Link2, type LucideIcon, Plus } from 'lucide-react'
import { MARKER_STATUS_HEX } from '@/components/Map/TaskMarkers/const'
import type { TranslateFn } from '@/i18n'
import { getStatusLabel } from '@/lib/taskConstants'
import { PRIORITY_COLOR } from '@/types/Priority'

export interface StatusLegendEntry {
  status: number
  label: string
  color: string
  icon: LucideIcon
}

const STATUS_ICONS: Record<number, LucideIcon> = {
  0: Plus,
  1: Check,
  2: CircleHelp,
  5: Link2,
  6: AlertTriangle,
}

export const getStatusLegendEntries = (t: TranslateFn): StatusLegendEntry[] =>
  Object.keys(STATUS_ICONS).map((status) => ({
    status: Number(status),
    label:
      getStatusLabel(t, Number(status)) ?? t({ id: 'common.unknown', defaultMessage: 'Unknown' }),
    color: MARKER_STATUS_HEX[Number(status)] ?? MARKER_STATUS_HEX[0],
    icon: STATUS_ICONS[Number(status)] ?? Plus,
  }))

export interface PriorityLegendEntry {
  priority: 0 | 1 | 2
  label: string
  color: string
}

export const getPriorityLegendEntries = (t: TranslateFn): PriorityLegendEntry[] => [
  {
    priority: 0,
    label: t({ id: 'statusLegend.priorityHigh', defaultMessage: 'High priority' }),
    color: PRIORITY_COLOR[0].hex,
  },
  {
    priority: 1,
    label: t({ id: 'statusLegend.priorityMedium', defaultMessage: 'Medium priority' }),
    color: PRIORITY_COLOR[1].hex,
  },
  {
    priority: 2,
    label: t({ id: 'statusLegend.priorityLow', defaultMessage: 'Low priority' }),
    color: PRIORITY_COLOR[2].hex,
  },
]
