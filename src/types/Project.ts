import type { CompletionMetrics } from './Challenge'
import type { components, operations, paths } from './openApiTypes'

/* Responses */
export type ProjectGetResponse =
  paths['/project/{id}']['get']['responses']['200']['content']['application/json']

export type ManagedProjectsFilters = Pick<
  NonNullable<operations['project_list_all_the_managed_projects']['parameters']['query']>,
  'searchString' | 'onlyEnabled' | 'onlyOwned' | 'isArchived' | 'projectIds'
>

/* Types From API (isArchived supported by API but not in generated schema) */
export type Project = components['schemas']['Project'] & {
  isArchived?: boolean
  completionMetrics?: CompletionMetrics
  /**
   * The team that owns this project, if one does. Its managers run the project
   * and its image is the picture on the card, exactly as for a challenge.
   */
  ownerTeamId?: number | null
  /**
   * The owning team's image, derived server-side from `ownerTeamId`. Absent
   * when no team owns the project.
   */
  avatarUrl?: string | null
}
