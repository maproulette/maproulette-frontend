import { queryOptions, useQuery } from '@tanstack/react-query'
import type { components } from '@/types/openApiTypes'
import { apiRequest } from '../client'

type ServiceInfo = components['schemas']['org.maproulette.models.service.info.ServiceInfo']

export const serviceApi = {
  info: () =>
    useQuery(
      queryOptions({
        queryKey: ['service', 'info'],
        queryFn: () => apiRequest.get('api/v2/service/info').json<ServiceInfo>(),
        staleTime: 60 * 60 * 1000,
        retry: 1,
      })
    ),
}
