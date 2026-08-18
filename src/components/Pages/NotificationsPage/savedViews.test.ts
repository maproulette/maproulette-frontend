// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_FILTER_STATE } from '@/hooks/useNotificationFilters'
import { logger } from '@/lib/logger'
import { loadSavedViews, persistSavedViews, SAVED_VIEWS_KEY, type SavedView } from './savedViews'

const validView: SavedView = {
  id: 'view-1',
  name: 'My view',
  state: { ...DEFAULT_FILTER_STATE, category: 'system' },
}

describe('loadSavedViews', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty array when nothing is stored', () => {
    expect(loadSavedViews()).toEqual([])
  })

  it('returns previously persisted valid views', () => {
    persistSavedViews([validView])
    expect(loadSavedViews()).toEqual([validView])
  })

  it('returns an empty array when the stored JSON is corrupt', () => {
    localStorage.setItem(SAVED_VIEWS_KEY, '{not valid json')
    expect(loadSavedViews()).toEqual([])
  })

  it('returns an empty array when the stored value is valid JSON but not an array', () => {
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify({ id: 'view-1' }))
    expect(loadSavedViews()).toEqual([])
  })

  it('filters out items missing required fields', () => {
    localStorage.setItem(
      SAVED_VIEWS_KEY,
      JSON.stringify([
        validView,
        { id: 'view-2' }, // missing name and state
        { name: 'no id', state: {} }, // missing id
        { id: 'view-3', name: 'no state' }, // missing state
        null,
        'a string entry',
      ])
    )
    expect(loadSavedViews()).toEqual([validView])
  })

  it('filters out items whose fields have the wrong type', () => {
    localStorage.setItem(
      SAVED_VIEWS_KEY,
      JSON.stringify([
        { id: 123, name: 'wrong id type', state: {} },
        { id: 'view-x', name: 456, state: {} },
        { id: 'view-y', name: 'wrong state type', state: 'not an object' },
        { id: 'view-z', name: 'null state', state: null },
      ])
    )
    expect(loadSavedViews()).toEqual([])
  })
})

describe('persistSavedViews', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('writes the given views to localStorage as JSON', () => {
    persistSavedViews([validView])
    expect(JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) as string)).toEqual([validView])
  })

  it('writes an empty array when given no views', () => {
    persistSavedViews([])
    expect(JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) as string)).toEqual([])
  })

  it('logs and rethrows when localStorage.setItem fails', () => {
    const error = new Error('QuotaExceededError')
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw error
    })
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    expect(() => persistSavedViews([validView])).toThrow(error)
    expect(warnSpy).toHaveBeenCalledWith('Failed to persist saved notification views', {
      error: String(error),
    })

    setItemSpy.mockRestore()
    warnSpy.mockRestore()
  })
})
