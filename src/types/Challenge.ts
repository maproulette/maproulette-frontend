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
export type ExploreChallengesParams =
  operations['explore_challenge_list_challenges']['parameters']['query']

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
   * Root-relative path serving the image of the team that owns this
   * challenge, derived by the backend so clients never assemble it themselves.
   * Resolve with `resolveTeamImageUrl` before using it as an `<img>` src.
   *
   * Addressed by team rather than by image, so it always serves whatever that
   * team currently has approved. A team with no approved image answers 404
   * there, so treat a load failure as "no picture" rather than an error.
   *
   * Declared here rather than coming from the generated schema: the backend
   * writes it, but it is not declared on `BaseChallenge` in the API spec.
   */
  avatarUrl?: string | null
  /**
   * The team that owns this challenge, if one does. Owning it hands that
   * team's owners, admins and managers the right to manage the challenge, and
   * puts the team's image on its card.
   *
   * Declared here rather than coming from the generated schema: the backend
   * writes it, but it is not declared on `BaseChallenge` in the API spec.
   */
  ownerTeamId?: number | null
  /**
   * Comma-separated MapRoulette tags a challenge suggests to mappers when they
   * complete a task. The backend accepts and returns it, but the spec declares
   * it on the create/update schema (`ChallengeExtra`) rather than
   * `BaseChallenge`, so it is declared here too.
   */
  preferredTags?: string | null
  completionMetrics?: CompletionMetrics
}

/**
 * A user granted a role on a single challenge, as opposed to one who reaches it
 * through the parent project or the team that owns it. Declared here rather
 * than coming from the generated schema: the backend writes it, but it is not
 * declared in the API spec.
 */
export interface ChallengeManager {
  userId: number
  name: string
  role: number
}

/* Custom Types */
/**
 * Sort orders the explore-challenges endpoint accepts. `featured`, `tag_fix`
 * and `cooperative` are taxonomy sorts: they group a kind of challenge to the
 * front rather than ordering by a column, and fall back to name inside the
 * group.
 */
export type ExtendedFindParamsSortBy = NonNullable<NonNullable<ExploreChallengesParams>['sortBy']>

/** Daily task status counts from `GET /data/challenge/{id}/activity` (legacy admin Recent Activity). */
export type ChallengeActivityEntry = {
  date: string | number
  status: number
  statusName: string
  count: number
}
