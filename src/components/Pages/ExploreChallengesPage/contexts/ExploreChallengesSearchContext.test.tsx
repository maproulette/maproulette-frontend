// @vitest-environment happy-dom
import { useNavigate, useSearch } from '@tanstack/react-router'
import { act, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'
import {
  ExploreChallengesSearchContextProvider,
  useExploreChallengesSearchContext,
} from './ExploreChallengesSearchContext'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
  useSearch: vi.fn(),
}))

type SearchShape = Record<string, unknown>

const mockSearch = (value: SearchShape) => {
  vi.mocked(useSearch).mockReturnValue(value as unknown as ReturnType<typeof useSearch>)
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ExploreChallengesSearchContextProvider>{children}</ExploreChallengesSearchContextProvider>
)

const renderContext = () => renderHook(() => useExploreChallengesSearchContext(), { wrapper })

describe('ExploreChallengesSearchContext filters by view mode', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn() as unknown as ReturnType<typeof useNavigate>)
  })

  afterEach(() => {
    document.cookie =
      'mr4_explore_challenges_filters=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'
    vi.clearAllMocks()
  })

  it('applies the list filters in a list-only view', () => {
    mockSearch({ viewMode: 'grid', difficulty: 'Expert', workOn: 'Water', global: true })

    const { result } = renderContext()

    expect(result.current.extendedFindParams.difficulty).toBe(3)
    expect(result.current.extendedFindParams.keywords).toBe('water,waterway')
    expect(result.current.extendedFindParams.global).toBe(true)
  })

  it('leaves them out beside the map, where the markers are unfiltered', () => {
    mockSearch({ viewMode: 'grid-map', difficulty: 'Expert', workOn: 'Water', global: true })

    const { result } = renderContext()

    expect(result.current.extendedFindParams.difficulty).toBeUndefined()
    expect(result.current.extendedFindParams.keywords).toBeUndefined()
    expect(result.current.extendedFindParams.global).toBe(false)
  })

  it('keeps the filter state, so leaving the map view brings it back', () => {
    mockSearch({ viewMode: 'grid-map', difficulty: 'Expert', workOn: 'Water', global: true })

    const { result } = renderContext()
    expect(result.current.difficulty).toBe('Expert')

    act(() => {
      result.current.setViewMode('grid')
    })

    expect(result.current.extendedFindParams.difficulty).toBe(3)
    expect(result.current.extendedFindParams.keywords).toBe('water,waterway')
    expect(result.current.extendedFindParams.global).toBe(true)
  })
})
