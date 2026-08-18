// @vitest-environment happy-dom
import { Target } from 'lucide-react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { IntlProvider } from '@/i18n'
import { renderHook } from '@/test/renderHook'
import { SearchType } from '@/types/GlobalSearch'
import {
  parseSearchInput,
  SEARCH_TYPE_PREFIXES,
  type SearchTypeOption,
  useAllSearchTypes,
  useFilteredSearchTypes,
} from './searchTypes'

const intlWrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(IntlProvider, null, children)

describe('parseSearchInput', () => {
  it('parses the "c:" challenge prefix', () => {
    expect(parseSearchInput('c:river cleanup')).toEqual({
      prefix: 'c:',
      query: 'river cleanup',
      searchType: SearchType.FIND_A_CHALLENGE,
    })
  })

  it('parses the "t:" task prefix', () => {
    expect(parseSearchInput('t:12345')).toEqual({
      prefix: 't:',
      query: '12345',
      searchType: SearchType.FIND_A_TASK,
    })
  })

  it('parses the "p:" project prefix', () => {
    expect(parseSearchInput('p:parks')).toEqual({
      prefix: 'p:',
      query: 'parks',
      searchType: SearchType.FIND_A_PROJECT,
    })
  })

  it('parses the "id:" MapRoulette ID prefix', () => {
    expect(parseSearchInput('id:987')).toEqual({
      prefix: 'id:',
      query: '987',
      searchType: SearchType.FIND_A_MAPROULETTE_ID,
    })
  })

  it('parses the "f:" feature-by-name prefix', () => {
    expect(parseSearchInput('f:Main Street')).toEqual({
      prefix: 'f:',
      query: 'Main Street',
      searchType: SearchType.FIND_A_MAPROULETTE_FEATURE_BY_NAME,
    })
  })

  it('parses the "tc:" task comment prefix', () => {
    expect(parseSearchInput('tc:looks good')).toEqual({
      prefix: 'tc:',
      query: 'looks good',
      searchType: SearchType.FIND_A_TASK_COMMENT,
    })
  })

  it('parses the "cc:" challenge comment prefix', () => {
    expect(parseSearchInput('cc:any updates?')).toEqual({
      prefix: 'cc:',
      query: 'any updates?',
      searchType: SearchType.FIND_A_CHALLENGE_COMMENT,
    })
  })

  it('trims surrounding whitespace before and after the prefix', () => {
    expect(parseSearchInput('   c:   river cleanup   ')).toEqual({
      prefix: 'c:',
      query: 'river cleanup',
      searchType: SearchType.FIND_A_CHALLENGE,
    })
  })

  it('returns a null prefix and searchType when no recognized prefix is present', () => {
    expect(parseSearchInput('river cleanup')).toEqual({
      prefix: null,
      query: 'river cleanup',
      searchType: null,
    })
  })

  it('does not mistake "cc:" for the shorter "c:" prefix', () => {
    const result = parseSearchInput('cc:comment text')
    expect(result.searchType).toBe(SearchType.FIND_A_CHALLENGE_COMMENT)
    expect(result.query).toBe('comment text')
  })
})

describe('useAllSearchTypes', () => {
  it('returns one option per search type, each with its matching prefix', () => {
    const { result } = renderHook(() => useAllSearchTypes(), { wrapper: intlWrapper })

    expect(result.current).toHaveLength(Object.keys(SEARCH_TYPE_PREFIXES).length)
    for (const option of result.current) {
      expect(option.prefix).toBe(SEARCH_TYPE_PREFIXES[option.id])
      expect(option.label.length).toBeGreaterThan(0)
      expect(option.description.length).toBeGreaterThan(0)
      expect(option.keywords.length).toBeGreaterThan(0)
    }
  })
})

const makeOption = (
  overrides: Partial<SearchTypeOption> & { id: SearchType }
): SearchTypeOption => ({
  label: '',
  description: '',
  icon: Target,
  keywords: [],
  prefix: '',
  ...overrides,
})

const allSearchTypes: SearchTypeOption[] = [
  makeOption({
    id: SearchType.FIND_A_CHALLENGE,
    label: 'Find a Challenge',
    description: 'Search for mapping challenges',
    keywords: ['challenge', 'mapping'],
    prefix: 'c:',
  }),
  makeOption({
    id: SearchType.FIND_A_TASK,
    label: 'Find a Task',
    description: 'Search for individual mapping tasks',
    keywords: ['task', 'todo', '2024'],
    prefix: 't:',
  }),
  makeOption({
    id: SearchType.FIND_A_PROJECT,
    label: 'Find a Project',
    description: 'Browse projects',
    keywords: ['project', 'collection'],
    prefix: 'p:',
  }),
  makeOption({
    id: SearchType.FIND_A_MAPROULETTE_ID,
    label: 'Find by MapRoulette ID',
    description: 'Navigate to a resource by its ID',
    keywords: ['id', 'identifier', 'number'],
    prefix: 'id:',
  }),
  makeOption({
    id: SearchType.FIND_A_MAPROULETTE_FEATURE_BY_NAME,
    label: 'Find a Feature by Name',
    description: 'Search for geographic features by name',
    keywords: ['feature', 'place'],
    prefix: 'f:',
  }),
  makeOption({
    id: SearchType.FIND_A_TASK_COMMENT,
    label: 'Find Task Comments',
    description: 'Search through comments left on tasks',
    keywords: ['comment', 'task', 'discussion'],
    prefix: 'tc:',
  }),
  makeOption({
    id: SearchType.FIND_A_CHALLENGE_COMMENT,
    label: 'Find Challenge Comments',
    description: 'Search through comments on challenges',
    keywords: ['comment', 'challenge', 'question'],
    prefix: 'cc:',
  }),
]

describe('useFilteredSearchTypes', () => {
  it('returns every search type unchanged when the query is empty', () => {
    const { result } = renderHook(() => useFilteredSearchTypes('', allSearchTypes))
    expect(result.current).toEqual(allSearchTypes)
  })

  it('narrows a numeric query to the type whose keywords contain it (numeric match)', () => {
    // "2024" is numeric, so the heuristic first restricts candidates to the
    // ID/task/challenge/project types, then matchesQuery narrows further to
    // only the option(s) whose label/description/keywords contain "2024".
    const { result } = renderHook(() => useFilteredSearchTypes('2024', allSearchTypes))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(SearchType.FIND_A_TASK)
  })

  it('falls back to the full numeric-allowed set when a numeric query matches no keywords', () => {
    const { result } = renderHook(() => useFilteredSearchTypes('99999', allSearchTypes))
    const ids = result.current.map((option) => option.id).sort()
    expect(ids).toEqual(
      [
        SearchType.FIND_A_MAPROULETTE_ID,
        SearchType.FIND_A_TASK,
        SearchType.FIND_A_CHALLENGE,
        SearchType.FIND_A_PROJECT,
      ].sort()
    )
  })

  it('narrows a multi-word query to the type whose text contains it (sentence/substring match)', () => {
    // "left on tasks" is a 3+ word query, so candidates are first restricted to
    // the comment/feature types, then narrowed by substring: only the task
    // comment option's description contains this exact phrase.
    const { result } = renderHook(() => useFilteredSearchTypes('left on tasks', allSearchTypes))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(SearchType.FIND_A_TASK_COMMENT)
  })

  it('matches a single-word, non-numeric query by substring against label/description/keywords', () => {
    const { result } = renderHook(() => useFilteredSearchTypes('project', allSearchTypes))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe(SearchType.FIND_A_PROJECT)
  })

  it('falls back to the whole relevant set when nothing matches the query text (no match)', () => {
    const { result } = renderHook(() => useFilteredSearchTypes('xyz', allSearchTypes))
    // Not numeric, not a 3+ word sentence, so the relevant set is all search types;
    // since none of their label/description/keywords contain "xyz", the heuristic
    // falls back to returning that entire relevant set rather than an empty list.
    expect(result.current).toEqual(allSearchTypes)
  })
})
