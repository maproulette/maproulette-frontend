import type { components, operations, paths } from './openApiTypes'

/* Responses */
export type PreferredChallengesResponse =
  paths['/challenges/preferred']['get']['responses']['200']['content']['application/json']
export type FeaturedChallengesResponse =
  components['schemas']['org.maproulette.framework.model.BaseChallenge']
export type ChallengeGetResponse =
  paths['/challenge/{id}']['get']['responses']['200']['content']['application/json']

export type ChallengeStatsResponse =
  paths['/data/challenge/{challengeId}']['get']['responses']['200']['content']['application/json']

export type ChallengeTaskMarkersResponse =
  paths['/challenge/{id}/taskMarkers']['get']['responses']['200']['content']['application/json']

export type ChallengeListingResponse =
  paths['/challenges/listing']['get']['responses']['200']['content']['application/json']

/*  Parameters  */
export type PreferredChallengesParams =
  operations['challenge_preferred_challenges']['parameters']['query']
export type FeaturedChallengesParams =
  operations['challenge_featured_challenges']['parameters']['query']
/**
 * `sortBy` is overridden rather than taken straight from the generated schema:
 * the taxonomy sorts (`featured`, `tag_fix`, `cooperative`) are declared here
 * until `openApiTypes.ts` is regenerated against a backend carrying them.
 */
export type ExploreChallengesParams =
  | (Omit<
      NonNullable<operations['explore_challenge_list_challenges']['parameters']['query']>,
      'sortBy'
    > & {
      sortBy?: ExtendedFindParamsSortBy
    })
  | undefined

/**
 * Explore-challenges query params plus the boundary of the selected place.
 * The boundary is sent in the request body rather than the query string --
 * a city boundary from Nominatim routinely runs to tens of kilobytes -- and
 * the server intersects it with `bounds`, so a challenge has to have a task
 * that is both in view and inside the place.
 */
export type ExploreChallengesRequest = NonNullable<ExploreChallengesParams> & {
  /** Serialized GeoJSON Polygon/MultiPolygon, already stringified */
  placeGeometryJson?: string
  /**
   * Short stand-in for `placeGeometryJson` in query keys, so React Query
   * never has to hash the geometry itself.
   */
  placeKey?: string
}

/**
 * Per-status task counts for a challenge or project. Mirrors the backend
 * CompletionMetrics case class. Stored directly on the object so consumers do
 * not need to fetch a separate stats endpoint.
 */
export type CompletionMetrics = {
  total: number
  available: number
  fixed: number
  falsePositive: number
  skipped: number
  deleted: number
  alreadyFixed: number
  tooHard: number
  answered: number
  validated: number
  disabled: number
  /** Derived: available + skipped + tooHard */
  tasksRemaining: number
}

/* Types From API */
// `tasksRemaining` has moved into `completionMetrics`; omit it from the
// generated schema type so usages are forced through the new field.
export type Challenge = Omit<
  components['schemas']['org.maproulette.framework.model.BaseChallenge'],
  'tasksRemaining'
> & {
  /**
   * The team image chosen as this challenge's card image, or null for none.
   * Only images approved for a team the challenge owner belongs to are
   * accepted; the backend rejects anything else.
   */
  teamImageId?: number | null
  /**
   * Root-relative path serving `teamImageId`'s bytes, derived by the backend so
   * clients never assemble it themselves. Resolve with `resolveTeamImageUrl`
   * before using it as an `<img>` src.
   *
   * Both fields are declared here rather than coming from the generated schema
   * so they stay available until `openApiTypes.ts` is regenerated against a
   * backend carrying them.
   */
  avatarUrl?: string | null
  /**
   * Comma-separated MapRoulette tags a challenge suggests to mappers when they
   * complete a task. The backend accepts and returns it, but it sits on the
   * create/update schema rather than `BaseChallenge`, so it is declared here
   * until `openApiTypes.ts` is regenerated against a backend carrying it.
   */
  preferredTags?: string | null
  completionMetrics?: CompletionMetrics
}

/* Custom Types */
/**
 * Sort orders the explore-challenges endpoint accepts. The last three are
 * taxonomy sorts: they group a kind of challenge to the front rather than
 * ordering by a column, and fall back to name inside the group.
 */
export type ExtendedFindParamsSortBy =
  | 'name'
  | 'created'
  | 'modified'
  | 'popularity'
  | 'difficulty'
  | 'featured'
  | 'tag_fix'
  | 'cooperative'

/** Daily task status counts from `GET /data/challenge/{id}/activity` (legacy admin Recent Activity). */
export type ChallengeActivityEntry = {
  date: string | number
  status: number
  statusName: string
  count: number
}
