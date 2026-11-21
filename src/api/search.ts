import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { apiRequest } from './client'

export interface SearchByIdResult {
  project: {
    id: number
    name: string
    displayName?: string
    description?: string
  } | null
  challenge: {
    id: number
    name: string
    description?: string
  } | null
  task: {
    id: number
    name: string
    status: number | null
    parent: number
  } | null
}

export const searchByIdOptions = (id: number) =>
  queryOptions({
    queryKey: ['search', 'byId', id],
    queryFn: () =>
      apiRequest.get('api/v2/search/byId', { searchParams: { id } }).json<SearchByIdResult>(),
    enabled: id > 0,
    placeholderData: keepPreviousData,
  })
