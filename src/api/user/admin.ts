import { queryOptions } from '@tanstack/react-query'
import type { GetAllUsersParams, User } from '@/types/User'
import { apiRequest, convertParamsToSearchParams } from '../client'

export const allUsersOptions = (params?: GetAllUsersParams) =>
  queryOptions({
    queryKey: ['user', 'all', params],
    queryFn: () =>
      apiRequest
        .get('api/v2/super-admin/users', {
          searchParams: convertParamsToSearchParams({
            limit: params?.limit ?? 50,
            page: params?.page ?? 0,
          }),
        })
        .json<User[]>(),
  })
