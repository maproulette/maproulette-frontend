import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  FolderOpen,
  Hash,
  ListTodo,
  MessageCircle,
  MessageSquare,
  Target,
} from 'lucide-react'
import { useMemo } from 'react'
import { useIntl } from '@/i18n'
import { SearchType } from '@/types/GlobalSearch'

export interface SearchTypeOption {
  id: SearchType
  label: string
  description: string
  icon: LucideIcon
  keywords: string[]
  prefix: string
}

// Map search types to their prefixes
export const SEARCH_TYPE_PREFIXES: Record<SearchType, string> = {
  [SearchType.FIND_A_CHALLENGE]: 'c:',
  [SearchType.FIND_A_TASK]: 't:',
  [SearchType.FIND_A_PROJECT]: 'p:',
  [SearchType.FIND_A_MAPROULETTE_ID]: 'id:',
  [SearchType.FIND_A_MAPROULETTE_FEATURE_BY_NAME]: 'f:',
  [SearchType.FIND_A_TASK_COMMENT]: 'tc:',
  [SearchType.FIND_A_CHALLENGE_COMMENT]: 'cc:',
}

// Helper to parse input and extract prefix and query
export const parseSearchInput = (
  input: string
): { prefix: string | null; query: string; searchType: SearchType | null } => {
  const trimmed = input.trim()
  for (const [searchType, prefix] of Object.entries(SEARCH_TYPE_PREFIXES)) {
    if (trimmed.startsWith(prefix)) {
      return {
        prefix,
        query: trimmed.slice(prefix.length).trim(),
        searchType: searchType as SearchType,
      }
    }
  }
  return { prefix: null, query: trimmed, searchType: null }
}

export const useAllSearchTypes = (): SearchTypeOption[] => {
  const { t } = useIntl()
  // Reason: stable reference needed — returned from hook and used as dependency in useFilteredSearchTypes
  return useMemo<SearchTypeOption[]>(
    () => [
      {
        id: SearchType.FIND_A_CHALLENGE,
        label: t({
          id: 'appLayout.header.globalSearch.types.challenge.label',
          defaultMessage: 'Find a Challenge',
        }),
        description: t({
          id: 'appLayout.header.globalSearch.types.challenge.description',
          defaultMessage:
            'Search for mapping challenges with filters for difficulty, location, and tags',
        }),
        icon: Target,
        keywords: ['challenge', 'mapping', 'task set', 'quest'],
        prefix: SEARCH_TYPE_PREFIXES[SearchType.FIND_A_CHALLENGE],
      },
      {
        id: SearchType.FIND_A_TASK,
        label: t({ id: 'common.findATask', defaultMessage: 'Find a Task' }),
        description: t({
          id: 'appLayout.header.globalSearch.types.task.description',
          defaultMessage:
            'Search for individual mapping tasks by ID, status, priority, or location',
        }),
        icon: ListTodo,
        keywords: ['task', 'item', 'work', 'todo'],
        prefix: SEARCH_TYPE_PREFIXES[SearchType.FIND_A_TASK],
      },
      {
        id: SearchType.FIND_A_PROJECT,
        label: t({
          id: 'appLayout.header.globalSearch.types.project.label',
          defaultMessage: 'Find a Project',
        }),
        description: t({
          id: 'appLayout.header.globalSearch.types.project.description',
          defaultMessage:
            'Browse projects containing multiple challenges organized by theme or area',
        }),
        icon: FolderOpen,
        keywords: ['project', 'collection', 'group', 'organization'],
        prefix: SEARCH_TYPE_PREFIXES[SearchType.FIND_A_PROJECT],
      },
      {
        id: SearchType.FIND_A_MAPROULETTE_ID,
        label: t({ id: 'common.findByMaprouletteId', defaultMessage: 'Find by MapRoulette ID' }),
        description: t({
          id: 'appLayout.header.globalSearch.types.id.description',
          defaultMessage:
            'Quickly navigate to any resource (project, challenge, or task) using its ID',
        }),
        icon: Hash,
        keywords: ['id', 'identifier', 'number', 'direct'],
        prefix: SEARCH_TYPE_PREFIXES[SearchType.FIND_A_MAPROULETTE_ID],
      },
      {
        id: SearchType.FIND_A_MAPROULETTE_FEATURE_BY_NAME,
        label: t({
          id: 'appLayout.header.globalSearch.types.featureByName.label',
          defaultMessage: 'Find a Feature by Name',
        }),
        description: t({
          id: 'appLayout.header.globalSearch.types.featureByName.description',
          defaultMessage:
            'Search for geographic features like roads, buildings, or landmarks by name',
        }),
        icon: FileText,
        keywords: ['feature', 'place', 'location', 'geography', 'name'],
        prefix: SEARCH_TYPE_PREFIXES[SearchType.FIND_A_MAPROULETTE_FEATURE_BY_NAME],
      },
      {
        id: SearchType.FIND_A_TASK_COMMENT,
        label: t({
          id: 'appLayout.header.globalSearch.types.taskComment.label',
          defaultMessage: 'Find Task Comments',
        }),
        description: t({
          id: 'appLayout.header.globalSearch.types.taskComment.description',
          defaultMessage: 'Search through comments left on tasks for discussions and notes',
        }),
        icon: MessageCircle,
        keywords: ['comment', 'task', 'discussion', 'note', 'feedback'],
        prefix: SEARCH_TYPE_PREFIXES[SearchType.FIND_A_TASK_COMMENT],
      },
      {
        id: SearchType.FIND_A_CHALLENGE_COMMENT,
        label: t({
          id: 'appLayout.header.globalSearch.types.challengeComment.label',
          defaultMessage: 'Find Challenge Comments',
        }),
        description: t({
          id: 'appLayout.header.globalSearch.types.challengeComment.description',
          defaultMessage: 'Search through comments on challenges for questions and suggestions',
        }),
        icon: MessageSquare,
        keywords: ['comment', 'challenge', 'discussion', 'question', 'feedback'],
        prefix: SEARCH_TYPE_PREFIXES[SearchType.FIND_A_CHALLENGE_COMMENT],
      },
    ],
    [t]
  )
}

const matchesQuery = (option: SearchTypeOption, query: string): boolean => {
  const haystack = [option.label, option.description, ...option.keywords].join(' ').toLowerCase()
  return haystack.includes(query)
}

export const useFilteredSearchTypes = (
  searchQuery: string,
  allSearchTypes: SearchTypeOption[]
): SearchTypeOption[] => {
  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return allSearchTypes

    const isNumber = /^\d+$/.test(query)
    const isSentence = query.split(/\s+/).length >= 3

    let relevantSearchTypes = allSearchTypes
    if (isNumber) {
      const allowed: SearchType[] = [
        SearchType.FIND_A_MAPROULETTE_ID,
        SearchType.FIND_A_TASK,
        SearchType.FIND_A_CHALLENGE,
        SearchType.FIND_A_PROJECT,
      ]
      relevantSearchTypes = allSearchTypes.filter((type) => allowed.includes(type.id))
    } else if (isSentence) {
      const allowed: SearchType[] = [
        SearchType.FIND_A_TASK_COMMENT,
        SearchType.FIND_A_CHALLENGE_COMMENT,
        SearchType.FIND_A_MAPROULETTE_FEATURE_BY_NAME,
      ]
      relevantSearchTypes = allSearchTypes.filter((type) => allowed.includes(type.id))
    }

    const matches = relevantSearchTypes.filter((type) => matchesQuery(type, query))
    return matches.length > 0 ? matches : relevantSearchTypes
  }, [searchQuery, allSearchTypes])
}
