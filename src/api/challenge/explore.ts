import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import { HTTPError } from 'ky'
import { logger } from '@/lib/logger'
import type {
  Challenge,
  ChallengeGetResponse,
  ChallengeListingFilters,
  ChallengeListingResponse,
  ExploreChallengesParams,
  ExploreChallengesRequest,
  FeaturedChallengesParams,
  FeaturedChallengesResponse,
  PreferredChallengesParams,
  PreferredChallengesResponse,
} from '@/types/Challenge'
import { apiRequest, convertParamsToSearchParams } from '../client'

const EXPLORE_CHALLENGES_URL = 'api/v2/challenges/exploreChallenges'

/**
 * Set once a server has shown it doesn't serve the POST form of
 * exploreChallenges, so the boundary isn't re-offered on every page.
 */
let placeBoundaryFilterUnsupported = false

/**
 * A server that predates the POST form rejects the request outright. Its own
 * complaint about the geometry is a different thing entirely and has to
 * surface, so it is matched by message and left to throw.
 */
const isMissingPostRoute = async (error: unknown): Promise<boolean> => {
  if (!(error instanceof HTTPError)) return false
  if (![400, 404, 405].includes(error.response.status)) return false
  const body = await error.response.clone().text()
  return !body.includes('polygon')
}

/**
 * Fetch one page of explore results. The place boundary can't travel in the
 * query string, so a request carrying one is a POST with the geometry in the
 * body; everything else stays a plain GET.
 */
const fetchExploreChallengesPage = async (
  params: Omit<ExploreChallengesRequest, 'placeGeometryJson' | 'placeKey'>,
  placeGeometryJson: string | undefined
): Promise<ChallengeGetResponse[]> => {
  const searchParams = convertParamsToSearchParams(params)

  if (placeGeometryJson && !placeBoundaryFilterUnsupported) {
    try {
      return await apiRequest
        .post(EXPLORE_CHALLENGES_URL, {
          searchParams,
          body: `{"polygon":${placeGeometryJson}}`,
        })
        .json<ChallengeGetResponse[]>()
    } catch (error) {
      if (!(await isMissingPostRoute(error))) throw error
      // The bounding box in `bounds` still applies; results just aren't
      // narrowed to the boundary within it.
      placeBoundaryFilterUnsupported = true
      logger.warn(
        'Server does not accept a place boundary for exploreChallenges; filtering by bounding box only'
      )
    }
  }

  return apiRequest.get(EXPLORE_CHALLENGES_URL, { searchParams }).json<ChallengeGetResponse[]>()
}

export const challengeExplore = {
  /**
   * Challenges at one difficulty (1 easy / 2 normal / 3 expert), most popular first.
   * Imperative rather than a hook: the caller picks one at random on demand, it isn't
   * rendering the list.
   */
  fetchChallengesByDifficulty: (difficulty: number, limit = 50) =>
    apiRequest
      .get('api/v2/challenges/exploreChallenges', {
        searchParams: convertParamsToSearchParams({
          global: true,
          sortBy: 'popularity',
          limit,
          difficulty,
        }),
      })
      .json<Challenge[]>(),

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

  featuredChallenges: (
    params: FeaturedChallengesParams,
    { enabled = true }: { enabled?: boolean } = {}
  ) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', 'featured', params],
        queryFn: () =>
          apiRequest
            .get(`api/v2/challenges/featured`, {
              searchParams: params,
            })
            .json<FeaturedChallengesResponse[]>(),
        enabled,
      })
    ),

  exploreChallenges: (params: ExploreChallengesParams) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', 'explore', params],
        queryFn: () =>
          apiRequest
            .get(`api/v2/challenges/exploreChallenges`, {
              searchParams: params ? convertParamsToSearchParams(params) : undefined,
            })
            .json<ChallengeGetResponse[]>(),
        placeholderData: (previousData) => previousData,
      })
    ),

  exploreChallengesInfinite: (
    params: ExploreChallengesRequest | undefined,
    options?: { enabled?: boolean }
  ) => {
    const { placeGeometryJson, placeKey, ...queryParams } = params ?? {}
    return useInfiniteQuery(
      infiniteQueryOptions({
        queryKey: ['challenge', 'exploreInfinite', queryParams, placeKey ?? null],
        queryFn: ({ pageParam = 0 }) =>
          fetchExploreChallengesPage({ ...queryParams, offset: pageParam }, placeGeometryJson),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const limit = params?.limit ?? 10
          if (lastPage.length < limit) return undefined
          return allPages.length * limit
        },
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
      })
    )
  },

  listingInfinite: (
    projectIds: number[],
    filters: ChallengeListingFilters,
    { limit = 20, enabled = true }: { limit?: number; enabled?: boolean } = {}
  ) =>
    useInfiniteQuery(
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
          lastPage.length < limit ? undefined : allPages.length,
        placeholderData: keepPreviousData,
        enabled,
      })
    ),

  searchChallenges: ({ search = '' }: { search?: string } = {}) =>
    useQuery(
      queryOptions({
        queryKey: ['challenge', 'search', { search }],
        queryFn: () =>
          apiRequest
            .get('api/v2/challenges/search', {
              searchParams: {
                search,
              },
            })
            .json<ChallengeGetResponse[]>(),
        enabled: search.length > 0,
      })
    ),
}
