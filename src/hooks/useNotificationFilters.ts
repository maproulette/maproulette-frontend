import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Notification, NotificationCategory, NotificationStatus } from '@/types/Notification'
import {
  getNotificationCategory,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_STATUSES,
} from '@/types/Notification'

export type NotificationFilterState = {
  category: NotificationCategory
  status: NotificationStatus
  filterTask: string
  filterType: string
  filterFrom: string
  filterChallenge: string
}

export const DEFAULT_FILTER_STATE: NotificationFilterState = {
  category: 'all',
  status: 'all',
  filterTask: 'all',
  filterType: 'all',
  filterFrom: 'all',
  filterChallenge: 'all',
}

const LAST_FILTERS_KEY = 'mr4:notifications:lastFilters'

export const useNotificationFilters = (notifications: Notification[]) => {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_app/notifications' })

  const category: NotificationCategory = NOTIFICATION_CATEGORIES.includes(
    (search.category ?? 'all') as NotificationCategory
  )
    ? ((search.category ?? 'all') as NotificationCategory)
    : 'all'
  const status: NotificationStatus = NOTIFICATION_STATUSES.includes(
    (search.status ?? 'all') as NotificationStatus
  )
    ? ((search.status ?? 'all') as NotificationStatus)
    : 'all'
  const filterTask = search.task ?? 'all'
  const filterType = search.type ?? 'all'
  const filterFrom = search.from ?? 'all'
  const filterChallenge = search.challenge ?? 'all'

  // Reason: writes a full filter state to the URL, dropping keys that equal their defaults
  // so the URL stays clean. Used when applying a saved view (whole-state replace).
  const writeState = useCallback(
    (state: NotificationFilterState) => {
      navigate({
        to: '/notifications',
        search: (prev) => {
          const next: Record<string, unknown> = { ...prev }
          delete next.category
          delete next.status
          delete next.task
          delete next.type
          delete next.from
          delete next.challenge
          if (state.category !== DEFAULT_FILTER_STATE.category) next.category = state.category
          if (state.status !== DEFAULT_FILTER_STATE.status) next.status = state.status
          if (state.filterTask !== DEFAULT_FILTER_STATE.filterTask) next.task = state.filterTask
          if (state.filterType !== DEFAULT_FILTER_STATE.filterType) next.type = state.filterType
          if (state.filterFrom !== DEFAULT_FILTER_STATE.filterFrom) next.from = state.filterFrom
          if (state.filterChallenge !== DEFAULT_FILTER_STATE.filterChallenge)
            next.challenge = state.filterChallenge
          return next
        },
        replace: true,
      })
    },
    [navigate]
  )

  // Reason: URL writes must drop values that are back to their defaults so the URL stays clean.
  const setField = useCallback(
    <K extends keyof NotificationFilterState>(key: K, value: NotificationFilterState[K]) => {
      const isDefault = value === DEFAULT_FILTER_STATE[key]
      navigate({
        to: '/notifications',
        search: (prev) => {
          const next: Record<string, unknown> = { ...prev }
          const searchKey =
            key === 'filterTask'
              ? 'task'
              : key === 'filterType'
                ? 'type'
                : key === 'filterFrom'
                  ? 'from'
                  : key === 'filterChallenge'
                    ? 'challenge'
                    : key
          if (isDefault) {
            delete next[searchKey]
          } else {
            next[searchKey] = value
          }
          return next
        },
        replace: true,
      })
    },
    [navigate]
  )

  const setCategory = useCallback(
    (value: NotificationCategory) => setField('category', value),
    [setField]
  )
  const setStatus = useCallback(
    (value: NotificationStatus) => setField('status', value),
    [setField]
  )
  const setFilterTask = useCallback((value: string) => setField('filterTask', value), [setField])
  const setFilterType = useCallback((value: string) => setField('filterType', value), [setField])
  const setFilterFrom = useCallback((value: string) => setField('filterFrom', value), [setField])
  const setFilterChallenge = useCallback(
    (value: string) => setField('filterChallenge', value),
    [setField]
  )

  const applyFilterState = useCallback(
    (state: NotificationFilterState) => {
      writeState(state)
    },
    [writeState]
  )

  const hasActiveFilters =
    category !== 'all' ||
    status !== 'all' ||
    filterTask !== 'all' ||
    filterType !== 'all' ||
    filterFrom !== 'all' ||
    filterChallenge !== 'all'

  const clearFilters = useCallback(() => {
    navigate({
      to: '/notifications',
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev }
        delete next.category
        delete next.status
        delete next.task
        delete next.type
        delete next.from
        delete next.challenge
        return next
      },
      replace: true,
    })
  }, [navigate])

  // Reason: extracting unique values via Sets from all notifications — used as dependency in consumers
  const filterOptions = useMemo(() => {
    const tasks = new Set<number>()
    const types = new Set<number>()
    const fromUsers = new Set<string>()
    const challenges = new Set<string>()

    notifications.forEach((n) => {
      if (n.taskId) tasks.add(n.taskId)
      if (n.notificationType !== undefined) types.add(n.notificationType)
      if (n.fromUsername) fromUsers.add(n.fromUsername)
      if (n.challengeName) challenges.add(n.challengeName)
    })

    return {
      tasks: Array.from(tasks).sort((a, b) => a - b),
      types: Array.from(types).sort((a, b) => a - b),
      fromUsers: Array.from(fromUsers).sort(),
      challenges: Array.from(challenges).sort(),
    }
  }, [notifications])

  // Reason: counts displayed on pills; derived once per notifications change.
  const categoryCounts = useMemo(() => {
    const counts: Record<NotificationCategory, number> = {
      all: notifications.length,
      task_comment: 0,
      mention: 0,
      challenge: 0,
      team: 0,
      system: 0,
    }
    for (const n of notifications) {
      const cat = getNotificationCategory(n.notificationType)
      counts[cat] += 1
    }
    return counts
  }, [notifications])

  const statusCounts = useMemo(() => {
    let unread = 0
    for (const n of notifications) {
      if (!n.isRead) unread += 1
    }
    return {
      all: notifications.length,
      unread,
      read: notifications.length - unread,
    }
  }, [notifications])

  // Reason: stable reference needed — used as dependency in useMemo hooks in page context
  const applyFilters = useCallback(
    (notificationsToFilter: Notification[]) => {
      let filtered = notificationsToFilter

      if (category !== 'all') {
        filtered = filtered.filter((n) => getNotificationCategory(n.notificationType) === category)
      }

      if (status === 'unread') {
        filtered = filtered.filter((n) => !n.isRead)
      } else if (status === 'read') {
        filtered = filtered.filter((n) => n.isRead)
      }

      if (filterTask !== 'all') {
        const taskId = Number.parseInt(filterTask, 10)
        filtered = filtered.filter((n) => n.taskId === taskId)
      }

      if (filterType !== 'all') {
        const typeId = Number.parseInt(filterType, 10)
        filtered = filtered.filter((n) => n.notificationType === typeId)
      }

      if (filterFrom !== 'all') {
        filtered = filtered.filter((n) => n.fromUsername === filterFrom)
      }

      if (filterChallenge !== 'all') {
        filtered = filtered.filter((n) => n.challengeName === filterChallenge)
      }

      return filtered
    },
    [category, status, filterTask, filterType, filterFrom, filterChallenge]
  )

  // Reason: keep the last-used filter combo in localStorage so a fresh page load with no URL
  // params can restore the user's previous filter selection. Only touches localStorage when
  // state actually changes.
  const currentState: NotificationFilterState = useMemo(
    () => ({ category, status, filterTask, filterType, filterFrom, filterChallenge }),
    [category, status, filterTask, filterType, filterFrom, filterChallenge]
  )

  // Reason: on first mount with no filter params in the URL, restore the persisted last state
  // so users come back to their previous filters. Uses a ref to guarantee run-once semantics
  // without depending on `search` (which would re-trigger after the restore writes it). This
  // must run before the persist effect below — otherwise the persist effect overwrites
  // localStorage with the just-computed default state before this ever reads the saved value.
  const hasRestoredRef = useRef(false)
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true
    const hasUrlFilters =
      search.category !== undefined ||
      search.status !== undefined ||
      search.task !== undefined ||
      search.type !== undefined ||
      search.from !== undefined ||
      search.challenge !== undefined
    if (hasUrlFilters) return
    try {
      const raw = localStorage.getItem(LAST_FILTERS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<NotificationFilterState>
      const restored: NotificationFilterState = {
        category: NOTIFICATION_CATEGORIES.includes(parsed.category as NotificationCategory)
          ? (parsed.category as NotificationCategory)
          : 'all',
        status: NOTIFICATION_STATUSES.includes(parsed.status as NotificationStatus)
          ? (parsed.status as NotificationStatus)
          : 'all',
        filterTask: typeof parsed.filterTask === 'string' ? parsed.filterTask : 'all',
        filterType: typeof parsed.filterType === 'string' ? parsed.filterType : 'all',
        filterFrom: typeof parsed.filterFrom === 'string' ? parsed.filterFrom : 'all',
        filterChallenge:
          typeof parsed.filterChallenge === 'string' ? parsed.filterChallenge : 'all',
      }
      const anyNonDefault =
        restored.category !== 'all' ||
        restored.status !== 'all' ||
        restored.filterTask !== 'all' ||
        restored.filterType !== 'all' ||
        restored.filterFrom !== 'all' ||
        restored.filterChallenge !== 'all'
      if (anyNonDefault) {
        writeState(restored)
      }
    } catch {
      // Reason: storage may be disabled / malformed — restore is best-effort.
    }
  }, [search, writeState])

  useEffect(() => {
    try {
      localStorage.setItem(LAST_FILTERS_KEY, JSON.stringify(currentState))
    } catch {
      // Reason: storage may be disabled (private mode, quota) — persistence is best-effort.
    }
  }, [currentState])

  return {
    category,
    setCategory,
    status,
    setStatus,
    filterTask,
    setFilterTask,
    filterType,
    setFilterType,
    filterFrom,
    setFilterFrom,
    filterChallenge,
    setFilterChallenge,
    hasActiveFilters,
    clearFilters,
    filterOptions,
    applyFilters,
    categoryCounts,
    statusCounts,
    currentState,
    applyFilterState,
  }
}
