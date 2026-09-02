import { queryOptions, useQuery } from '@tanstack/react-query'
import { graphqlRequest } from '../graphql'

export interface FollowedAction {
  id: number
  created: string
  typeId: number
  parentId: number | null
  parentName: string | null
  itemId: number | null
  action: number
  status: number
  user?: { id: number; osmProfile?: { displayName?: string; avatarURL?: string } } | null
  challenge?: { id: number; name: string } | null
  task?: { id: number } | null
}

const RECENT_ACTIVITY = `
  query FollowedActivity($osmIds: [Long!], $limit: Int, $offset: Int) {
    recentActions(osmIds: $osmIds, limit: $limit, offset: $offset) {
      id
      created
      typeId
      parentId
      parentName
      itemId
      action
      status
      user { id osmProfile { displayName avatarURL } }
      challenge { id name }
      task { id }
    }
  }
`

export const userFollowedActivity = {
  /**
   * Recent activity from the given mappers, newest first. Identified by OSM id
   * rather than MapRoulette id, which is what the query takes.
   */
  followedActivity: (osmIds: number[], options?: { enabled?: boolean; limit?: number }) =>
    useQuery(
      queryOptions({
        queryKey: ['user', 'followedActivity', [...osmIds].sort((a, b) => a - b), options?.limit],
        queryFn: async () => {
          const data = await graphqlRequest<{ recentActions: FollowedAction[] }>(RECENT_ACTIVITY, {
            osmIds,
            limit: options?.limit ?? 50,
            offset: 0,
          })
          return data.recentActions ?? []
        },
        // Nothing else in the app depends on this, and it is the only GraphQL
        // call we make, so a failure should stay quiet rather than retrying.
        retry: false,
        enabled: (options?.enabled ?? true) && osmIds.length > 0,
      })
    ),
}
