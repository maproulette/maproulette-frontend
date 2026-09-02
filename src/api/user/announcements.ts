import { queryOptions, useQuery } from '@tanstack/react-query'
import { parseSystemNotices, type SystemNotice } from '@/lib/systemNotices'
import { apiRequest } from '../client'

export const userAnnouncements = {
  /**
   * System notices the backend serves from its configured external JSON file.
   * A deployment that has none configured answers with an empty or unusable
   * body, which parses to no notices — so failures here are quiet by design
   * and must never block the app from rendering.
   */
  announcements: () =>
    useQuery(
      queryOptions({
        queryKey: ['user', 'announcements'],
        queryFn: async (): Promise<SystemNotice[]> => {
          try {
            const body = await apiRequest.get('api/v2/user/announcements').json<unknown>()
            return parseSystemNotices(body)
          } catch {
            return []
          }
        },
        staleTime: 15 * 60 * 1000,
        retry: false,
      })
    ),
}
