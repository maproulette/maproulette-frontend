import { queryOptions, useQuery } from '@tanstack/react-query'
import type { UserSearchResult } from '@/types/User'
import { apiRequest } from '../client'

export const userSearch = {
  findUsers: (prefix: string, limit: number = 10, enabled: boolean = true) =>
    useQuery(
      queryOptions({
        queryKey: ['user', 'search', { prefix, limit }],
        queryFn: () =>
          apiRequest
            .get(`api/v2/users/find/${encodeURIComponent(prefix)}`, {
              searchParams: { limit },
            })
            .json<UserSearchResult[]>(),
        enabled: enabled && prefix.length > 0,
        staleTime: 30_000,
      })
    ),
}
