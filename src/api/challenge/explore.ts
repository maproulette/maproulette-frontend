import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  ChallengeGetResponse,
  ChallengeListingResponse,
  ExploreChallengesParams,
  FeaturedChallengesParams,
  FeaturedChallengesResponse,
  PreferredChallengesParams,
  PreferredChallengesResponse,
} from '@/types/Challenge'
import { apiRequest, convertParamsToSearchParams } from '../client'
import { seedChallengeCache } from './single'

export const challengeExplore = {
  preferredChallenges: (params: PreferredChallengesParams) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', 'preferred', params],
        queryFn: () =>
          apiRequest
            .get(`api/v2/challenges/preferred`, {
              searchParams: params,
            })
            .json<PreferredChallengesResponse>(),
      })
    ),

  featuredChallenges: (params: FeaturedChallengesParams) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['challenge', 'featured', params],
        queryFn: async () => {
          const challenges = await apiRequest
            .get(`api/v2/challenges/featured`, {
              searchParams: params,
            })
            .json<FeaturedChallengesResponse[]>()
          seedChallengeCache(queryClient, challenges)
          return challenges
        },
      })
    )
  },

  exploreChallenges: (params: ExploreChallengesParams) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['challenge', 'explore', params],
        queryFn: async () => {
          const challenges = await apiRequest
            .get(`api/v2/challenges/exploreChallenges`, {
              searchParams: params ? convertParamsToSearchParams(params) : undefined,
            })
            .json<ChallengeGetResponse[]>()
          seedChallengeCache(queryClient, challenges)
          return challenges
        },
        placeholderData: (previousData) => previousData,
      })
    )
  },

  exploreChallengesInfinite: (params: ExploreChallengesParams) => {
    const queryClient = useQueryClient()
    return useInfiniteQuery(
      infiniteQueryOptions({
        queryKey: ['challenge', 'exploreInfinite', params],
        queryFn: async ({ pageParam = 0 }) => {
          const challenges = await apiRequest
            .get(`api/v2/challenges/exploreChallenges`, {
              searchParams: params
                ? convertParamsToSearchParams({ ...params, offset: pageParam })
                : undefined,
            })
            .json<ChallengeGetResponse[]>()
          seedChallengeCache(queryClient, challenges)
          return challenges
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const limit = params?.limit ?? 10
          if (lastPage.length < limit) return undefined
          return allPages.length * limit
        },
        placeholderData: keepPreviousData,
      })
    )
  },

  getChallengesListingOptions: (
    projectIds: number[],
    options?: { limit?: number; page?: number; onlyEnabled?: boolean }
  ) =>
    queryOptions({
      queryKey: [
        'challenge',
        'listing',
        projectIds,
        {
          limit: options?.limit ?? -1,
          page: options?.page ?? 0,
          onlyEnabled: options?.onlyEnabled ?? false,
        },
      ],
      queryFn: async () => {
        const challenges = await apiRequest
          .get('api/v2/challenges/listing', {
            searchParams: {
              projectIds: projectIds.join(','),
              limit: options?.limit ?? -1,
              page: options?.page ?? 0,
              onlyEnabled: options?.onlyEnabled ?? false,
            },
          })
          .json<ChallengeListingResponse>()
        return challenges
      },
    }),

  // `getChallengesListingOptions` hits the same lightweight `/challenges/listing`
  // endpoint (typed as `ChallengeListingResponse`), but existing callers of `listing`
  // rely on the fuller `ChallengeGetResponse[]` shape, so the composed result is
  // re-asserted to that type below to preserve their existing behavior/typing.
  listing: (projectIds: number[], limit = 100, page = 0, onlyEnabled = false) => {
    const queryClient = useQueryClient()
    return useQuery({
      ...challengeExplore.getChallengesListingOptions(projectIds, { limit, page, onlyEnabled }),
      select: (challenges) => {
        seedChallengeCache(queryClient, challenges)
        return challenges as unknown as ChallengeGetResponse[]
      },
    })
  },

  searchChallenges: ({ search = '' }: { search?: string } = {}) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['challenge', 'search', { search }],
        queryFn: async () => {
          const challenges = await apiRequest
            .get('api/v2/challenges/search', {
              searchParams: {
                search,
              },
            })
            .json<ChallengeGetResponse[]>()
          seedChallengeCache(queryClient, challenges)
          return challenges
        },
        enabled: search.length > 0,
      })
    )
  },
}
