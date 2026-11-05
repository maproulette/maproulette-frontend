// @vitest-environment happy-dom
import { useNavigate, useSearch } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { baseNotification } from '@/test/notificationFixtures'
import { renderHook } from '@/test/renderHook'
import type { Notification } from '@/types/Notification'
import { NotificationType } from '@/types/Notification'
import {
  DEFAULT_FILTER_STATE,
  type NotificationFilterState,
  useNotificationFilters,
} from './useNotificationFilters'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
  useSearch: vi.fn(),
}))

const LAST_FILTERS_KEY = 'mr4:notifications:lastFilters'

type SearchShape = {
  category?: string
  status?: string
  task?: string
  type?: string
  from?: string
  challenge?: string
}

type NavArg = {
  to: string
  replace: boolean
  search: (prev: Record<string, unknown>) => Record<string, unknown>
}

describe('useNotificationFilters', () => {
  let navigateMock: ReturnType<typeof vi.fn>

  const mockSearch = (value: SearchShape) => {
    vi.mocked(useSearch).mockReturnValue(value as unknown as ReturnType<typeof useSearch>)
  }

  const lastNavCall = (): NavArg => {
    const call = navigateMock.mock.calls.at(-1)
    if (!call) throw new Error('navigate was not called')
    return call[0] as NavArg
  }

  beforeEach(() => {
    navigateMock = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(
      navigateMock as unknown as ReturnType<typeof useNavigate>
    )
    mockSearch({})
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('field derivation from the URL', () => {
    it('defaults every field to "all" when the URL has no filter params', () => {
      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.category).toBe('all')
      expect(result.current.status).toBe('all')
      expect(result.current.filterTask).toBe('all')
      expect(result.current.filterType).toBe('all')
      expect(result.current.filterFrom).toBe('all')
      expect(result.current.filterChallenge).toBe('all')
    })

    it('reads valid values straight from the URL', () => {
      mockSearch({
        category: 'mention',
        status: 'unread',
        task: '5',
        type: '2',
        from: 'alice',
        challenge: 'Fix Roads',
      })

      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.category).toBe('mention')
      expect(result.current.status).toBe('unread')
      expect(result.current.filterTask).toBe('5')
      expect(result.current.filterType).toBe('2')
      expect(result.current.filterFrom).toBe('alice')
      expect(result.current.filterChallenge).toBe('Fix Roads')
    })

    it('falls back to "all" for an invalid category', () => {
      mockSearch({ category: 'not-a-real-category' })

      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.category).toBe('all')
    })

    it('falls back to "all" for an invalid status', () => {
      mockSearch({ status: 'not-a-real-status' })

      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.status).toBe('all')
    })
  })

  describe('setters', () => {
    it.each([
      ['setCategory', 'mention', 'category'] as const,
      ['setStatus', 'unread', 'status'] as const,
      ['setFilterTask', '7', 'task'] as const,
      ['setFilterType', '3', 'type'] as const,
      ['setFilterFrom', 'bob', 'from'] as const,
      ['setFilterChallenge', 'Roads', 'challenge'] as const,
    ])('%s writes a non-default value to the "%s" search param', (setterName, value, searchKey) => {
      const { result } = renderHook(() => useNotificationFilters([]))
      const setter = result.current[
        setterName as keyof ReturnType<typeof useNotificationFilters>
      ] as (v: string) => void

      setter(value)

      const { to, replace, search } = lastNavCall()
      expect(to).toBe('/notifications')
      expect(replace).toBe(true)
      expect(search({ notificationId: 5 })).toEqual({ notificationId: 5, [searchKey]: value })
    })

    it.each([
      ['setCategory', 'category'] as const,
      ['setStatus', 'status'] as const,
      ['setFilterTask', 'task'] as const,
      ['setFilterType', 'type'] as const,
      ['setFilterFrom', 'from'] as const,
      ['setFilterChallenge', 'challenge'] as const,
    ])('%s removes the "%s" search param when set back to its default', (setterName, searchKey) => {
      const { result } = renderHook(() => useNotificationFilters([]))
      const setter = result.current[
        setterName as keyof ReturnType<typeof useNotificationFilters>
      ] as (v: string) => void

      setter('all')

      const { search } = lastNavCall()
      expect(search({ [searchKey]: 'something', other: 'kept' })).toEqual({ other: 'kept' })
    })
  })

  describe('applyFilterState / writeState', () => {
    it('writes only the non-default fields and drops the rest', () => {
      const { result } = renderHook(() => useNotificationFilters([]))
      const state: NotificationFilterState = {
        ...DEFAULT_FILTER_STATE,
        category: 'challenge',
        status: 'unread',
        filterTask: '42',
        filterType: '3',
        filterFrom: 'alice',
      }

      result.current.applyFilterState(state)

      const { to, replace, search } = lastNavCall()
      expect(to).toBe('/notifications')
      expect(replace).toBe(true)
      expect(
        search({ category: 'stale', status: 'stale', task: 'stale', notificationId: 1 })
      ).toEqual({
        notificationId: 1,
        category: 'challenge',
        status: 'unread',
        task: '42',
        type: '3',
        from: 'alice',
      })
    })

    it('drops every filter key when applying the fully-default state', () => {
      const { result } = renderHook(() => useNotificationFilters([]))

      result.current.applyFilterState(DEFAULT_FILTER_STATE)

      const { search } = lastNavCall()
      expect(
        search({
          category: 'mention',
          status: 'unread',
          task: '1',
          type: '2',
          from: 'x',
          challenge: 'y',
          notificationId: 9,
        })
      ).toEqual({ notificationId: 9 })
    })
  })

  describe('clearFilters', () => {
    it('removes every filter key from the URL', () => {
      const { result } = renderHook(() => useNotificationFilters([]))

      result.current.clearFilters()

      const { to, replace, search } = lastNavCall()
      expect(to).toBe('/notifications')
      expect(replace).toBe(true)
      expect(
        search({
          category: 'mention',
          status: 'unread',
          task: '1',
          type: '2',
          from: 'x',
          challenge: 'y',
          notificationId: 9,
        })
      ).toEqual({ notificationId: 9 })
    })
  })

  describe('hasActiveFilters', () => {
    it('is false when every field is at its default', () => {
      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.hasActiveFilters).toBe(false)
    })

    it.each([
      ['category', { category: 'mention' }],
      ['status', { status: 'unread' }],
      ['filterTask', { task: '5' }],
      ['filterType', { type: '2' }],
      ['filterFrom', { from: 'alice' }],
      ['filterChallenge', { challenge: 'Fix Roads' }],
    ])('is true when %s differs from its default', (_label, overrides) => {
      mockSearch(overrides)

      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.hasActiveFilters).toBe(true)
    })
  })

  describe('filterOptions', () => {
    it('extracts sorted, de-duplicated values from the notification list', () => {
      const notifications = [
        baseNotification({
          id: 1,
          taskId: 20,
          notificationType: 2,
          fromUsername: 'bob',
          challengeName: 'Zeta',
        }),
        baseNotification({
          id: 2,
          taskId: 10,
          notificationType: 1,
          fromUsername: 'alice',
          challengeName: 'Alpha',
        }),
        baseNotification({
          id: 3,
          taskId: 10,
          notificationType: 1,
          fromUsername: 'alice',
          challengeName: 'Alpha',
        }),
        baseNotification({ id: 4 }),
      ]

      const { result } = renderHook(() => useNotificationFilters(notifications))

      expect(result.current.filterOptions).toEqual({
        tasks: [10, 20],
        types: [0, 1, 2],
        fromUsers: ['alice', 'bob'],
        challenges: ['Alpha', 'Zeta'],
      })
    })

    it('returns empty option lists for an empty notification array', () => {
      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.filterOptions).toEqual({
        tasks: [],
        types: [],
        fromUsers: [],
        challenges: [],
      })
    })
  })

  describe('categoryCounts', () => {
    it('buckets notifications into categories, defaulting unmapped types to system', () => {
      const notifications = [
        baseNotification({ id: 1, notificationType: NotificationType.MENTION }),
        baseNotification({ id: 2, notificationType: NotificationType.REVIEW_APPROVED }),
        baseNotification({ id: 3, notificationType: undefined as unknown as number }),
      ]

      const { result } = renderHook(() => useNotificationFilters(notifications))

      expect(result.current.categoryCounts).toEqual({
        all: 3,
        task_comment: 0,
        mention: 1,
        challenge: 0,
        team: 0,
        system: 2,
      })
    })
  })

  describe('statusCounts', () => {
    it('counts read vs unread notifications', () => {
      const notifications = [
        baseNotification({ id: 1, isRead: true }),
        baseNotification({ id: 2, isRead: false }),
        baseNotification({ id: 3, isRead: false }),
      ]

      const { result } = renderHook(() => useNotificationFilters(notifications))

      expect(result.current.statusCounts).toEqual({ all: 3, unread: 2, read: 1 })
    })
  })

  describe('applyFilters', () => {
    const notifications = [
      baseNotification({
        id: 1,
        notificationType: NotificationType.MENTION,
        isRead: false,
        taskId: 1,
        fromUsername: 'alice',
        challengeName: 'Alpha',
      }),
      baseNotification({
        id: 2,
        notificationType: NotificationType.REVIEW_APPROVED,
        isRead: true,
        taskId: 2,
        fromUsername: 'bob',
        challengeName: 'Beta',
      }),
    ]

    it('returns the input unchanged when no filters are active', () => {
      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.applyFilters(notifications)).toBe(notifications)
    })

    it.each([
      ['category', { category: 'mention' }, 0],
      ['unread status', { status: 'unread' }, 0],
      ['read status', { status: 'read' }, 1],
      ['task id', { task: '2' }, 1],
      ['notification type', { type: String(NotificationType.MENTION) }, 0],
      ['sender username', { from: 'bob' }, 1],
      ['challenge name', { challenge: 'Alpha' }, 0],
    ] as const)('filters by %s', (_label, params, expectedIndex) => {
      mockSearch(params)
      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.applyFilters(notifications)).toEqual([notifications[expectedIndex]])
    })

    it('applies every active filter together', () => {
      mockSearch({
        category: 'mention',
        status: 'unread',
        task: '1',
        from: 'alice',
        challenge: 'Alpha',
      })
      const { result } = renderHook(() => useNotificationFilters([]))

      expect(result.current.applyFilters(notifications)).toEqual([notifications[0]])
    })
  })

  describe('localStorage restore on mount', () => {
    it('does not restore when the URL already has filter params', () => {
      localStorage.setItem(
        LAST_FILTERS_KEY,
        JSON.stringify({ ...DEFAULT_FILTER_STATE, category: 'mention' })
      )
      mockSearch({ category: 'challenge' })

      renderHook(() => useNotificationFilters([]))

      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('does not restore when nothing is persisted', () => {
      renderHook(() => useNotificationFilters([]))

      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('does not restore when the persisted state is already all-default', () => {
      localStorage.setItem(LAST_FILTERS_KEY, JSON.stringify(DEFAULT_FILTER_STATE))

      renderHook(() => useNotificationFilters([]))

      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('silently ignores malformed persisted JSON', () => {
      localStorage.setItem(LAST_FILTERS_KEY, '{not-valid-json')

      expect(() => renderHook(() => useNotificationFilters([]))).not.toThrow()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('silently ignores a localStorage.getItem failure', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage disabled')
      })

      expect(() => renderHook(() => useNotificationFilters([]))).not.toThrow()
      expect(navigateMock).not.toHaveBeenCalled()
    })

    it('restores a persisted non-default state via writeState when the URL has none', () => {
      localStorage.setItem(
        LAST_FILTERS_KEY,
        JSON.stringify({ ...DEFAULT_FILTER_STATE, category: 'mention', filterTask: '9' })
      )

      renderHook(() => useNotificationFilters([]))

      const { to, replace, search } = lastNavCall()
      expect(to).toBe('/notifications')
      expect(replace).toBe(true)
      expect(search({})).toEqual({ category: 'mention', task: '9' })
    })

    it('falls back to "all" when the persisted filterChallenge is not a string', () => {
      localStorage.setItem(
        LAST_FILTERS_KEY,
        JSON.stringify({ ...DEFAULT_FILTER_STATE, filterFrom: 'bob', filterChallenge: 42 })
      )

      renderHook(() => useNotificationFilters([]))

      const { search } = lastNavCall()
      expect(search({})).toEqual({ from: 'bob' })
    })

    it('falls back to defaults for persisted fields with an invalid type or value', () => {
      localStorage.setItem(
        LAST_FILTERS_KEY,
        JSON.stringify({
          category: 'not-a-category',
          status: 123,
          filterTask: 9,
          filterType: 9,
          filterFrom: 9,
          filterChallenge: 'Roads',
        })
      )

      renderHook(() => useNotificationFilters([]))

      const { search } = lastNavCall()
      expect(search({})).toEqual({ challenge: 'Roads' })
    })
  })

  describe('localStorage persistence', () => {
    it('persists the current filter state on mount', () => {
      mockSearch({ category: 'mention' })

      renderHook(() => useNotificationFilters([]))

      expect(JSON.parse(localStorage.getItem(LAST_FILTERS_KEY) ?? '{}')).toEqual({
        ...DEFAULT_FILTER_STATE,
        category: 'mention',
      })
    })

    it('re-persists when the derived filter state changes', () => {
      mockSearch({ category: 'mention' })
      const { rerender } = renderHook(
        (notifications: Notification[]) => useNotificationFilters(notifications),
        {
          initialProps: [],
        }
      )

      mockSearch({ category: 'challenge' })
      rerender([])

      expect(JSON.parse(localStorage.getItem(LAST_FILTERS_KEY) ?? '{}')).toEqual({
        ...DEFAULT_FILTER_STATE,
        category: 'challenge',
      })
    })

    it('silently ignores a localStorage.setItem failure', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })

      expect(() => renderHook(() => useNotificationFilters([]))).not.toThrow()
    })
  })
})
