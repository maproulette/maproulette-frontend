import { queryOptions, useQuery } from '@tanstack/react-query'
import type { GetAllUsersParams, User } from '@/types/User'
import { apiRequest, convertParamsToSearchParams } from '../client'

export const userAdmin = {
  getAllUsers: (params?: GetAllUsersParams) => {
    return useQuery(
      queryOptions({
        queryKey: ['user', 'all', params],
        queryFn: async () => {
          const users = await apiRequest
            .get('api/v2/super-admin/users', {
              searchParams: convertParamsToSearchParams({
                limit: params?.limit ?? 50,
                page: params?.page ?? 0,
              }),
            })
            .json<User[]>()
          return users
        },
      })
    )
  },

  getSuperUsers: () =>
    useQuery(
      queryOptions({
        queryKey: ['user', 'superusers'],
        queryFn: () => apiRequest.get('api/v2/superusers').json<number[]>(),
      })
    ),
}
