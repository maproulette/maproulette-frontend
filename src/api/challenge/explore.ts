import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query'
import type {
  ChallengeGetResponse,
  ChallengeListingFilters,
  ChallengeListingResponse,
  ExploreChallengesRequest,
} from '@/types/Challenge'
import { apiRequest, convertParamsToSearchParams } from '../client'

const EXPLORE_CHALLENGES_URL = 'api/v2/challenges/exploreChallenges'

/**
 * Fetch one page of explore results.
 */
const fetchExploreChallengesPage = (
  params: Omit<ExploreChallengesRequest, 'placeGeometryJson' | 'placeKey'>,
  placeGeometryJson: string | undefined
): Promise<ChallengeGetResponse[]> => {
  const searchParams = convertParamsToSearchParams(params)
  const request = placeGeometryJson
    ? apiRequest.post(EXPLORE_CHALLENGES_URL, {
        searchParams,
        body: `{"polygon":${placeGeometryJson}}`,
      })
    : apiRequest.get(EXPLORE_CHALLENGES_URL, { searchParams })
  return request.json<ChallengeGetResponse[]>()
}

export const exploreChallengesInfiniteOptions = (params: ExploreChallengesRequest | undefined) => {
  const { placeGeometryJson, placeKey, ...queryParams } = params ?? {}
  const limit = params?.limit ?? 10
  return infiniteQueryOptions({
    queryKey: ['challenge', 'exploreInfinite', queryParams, placeKey ?? null],
    queryFn: ({ pageParam }) =>
      fetchExploreChallengesPage({ ...queryParams, offset: pageParam }, placeGeometryJson),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < limit ? undefined : allPages.length * limit,
    placeholderData: keepPreviousData,
  })
}

export const challengeListingInfiniteOptions = (
  projectIds: number[],
  filters: ChallengeListingFilters,
  limit = 20
) =>
  infiniteQueryOptions({
    queryKey: ['challenge', 'listing', 'infinite', projectIds, { limit, ...filters }],
    queryFn: ({ pageParam }) =>
      apiRequest
        .get('api/v2/challenges/listing', {
          searchParams: {
            projectIds: projectIds.join(','),
            limit,
            page: pageParam,
            onlyEnabled: false,
            ...filters,
          },
        })
        .json<ChallengeListingResponse>(),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < limit ? undefined : allPages.length * limit,
    placeholderData: keepPreviousData,
  })

export const searchChallengesOptions = ({
  search = '',
  limit = 25,
}: {
  search?: string
  limit?: number
} = {}) =>
  queryOptions({
    queryKey: ['challenge', 'search', { search, limit }],
    queryFn: ({ signal }) =>
      apiRequest
        .get('api/v2/challenges/search', {
          searchParams: { search, limit, onlyEnabled: true },
          signal,
        })
        .json<ChallengeGetResponse[]>(),
    enabled: search.length > 0,
    placeholderData: keepPreviousData,
  })
