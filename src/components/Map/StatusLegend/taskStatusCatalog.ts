import { AlertTriangle, Check, CircleHelp, Link2, type LucideIcon, Plus } from 'lucide-react'
import type { TranslateFn } from '@/i18n'
import { getStatusLabel, resolveHex, STATUS_HEX_COLORS } from '@/lib/taskConstants'
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
    label: getStatusLabel(t, Number(status)) ?? t('common.unknown', undefined, 'Unknown'),
    color: resolveHex(STATUS_HEX_COLORS[Number(status)] ?? 'zinc-400'),
    icon: STATUS_ICONS[Number(status)] ?? Plus,
  }))

export interface PriorityLegendEntry {
  priority: 0 | 1 | 2
  label: string
  color: string
}

export const priorityEntries: PriorityLegendEntry[] = [
  { priority: 0, label: 'High priority', color: PRIORITY_COLOR[0].hex },
  { priority: 1, label: 'Medium priority', color: PRIORITY_COLOR[1].hex },
  { priority: 2, label: 'Low priority', color: PRIORITY_COLOR[2].hex },
]
