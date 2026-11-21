import { queryOptions } from '@tanstack/react-query'
import type { UserSearchResult } from '@/types/User'
import { apiRequest } from '../client'

/** Users whose name starts with `prefix`. */
export const findUsersOptions = (prefix: string, limit = 10) =>
  queryOptions({
    queryKey: ['user', 'search', { prefix, limit }],
    queryFn: ({ signal }) =>
      apiRequest
        .get(`api/v2/users/find/${encodeURIComponent(prefix)}`, { searchParams: { limit }, signal })
        .json<UserSearchResult[]>(),
    enabled: prefix.length > 0,
    staleTime: 30_000,
  })
