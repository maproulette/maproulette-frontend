import type { NotificationFilterState } from '@/hooks/useNotificationFilters'
import { logger } from '@/lib/logger'

export const SAVED_VIEWS_KEY = 'mr4:notifications:savedViews'

export type SavedView = {
  id: string
  name: string
  state: NotificationFilterState
}

export const loadSavedViews = (): SavedView[] => {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is SavedView =>
        typeof v === 'object' &&
        v !== null &&
        typeof v.id === 'string' &&
        typeof v.name === 'string' &&
        typeof v.state === 'object' &&
        v.state !== null
    )
  } catch (error) {
    logger.warn('Failed to load saved notification views', { error: String(error) })
    return []
  }
}

export const persistSavedViews = (views: SavedView[]) => {
  try {
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views))
  } catch (error) {
    logger.warn('Failed to persist saved notification views', { error: String(error) })
    throw error
  }
}
