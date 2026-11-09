import type { components, operations } from './openApiTypes'

export type ManagedProjectsFilters = Pick<
  NonNullable<operations['project_list_all_the_managed_projects']['parameters']['query']>,
  'searchString' | 'onlyEnabled' | 'onlyOwned' | 'projectIds'
> & { isArchived?: boolean }

type ProjectChallengeCounts = NonNullable<
  operations['project_list_all_the_managed_projects']['responses']['200']['content']['application/json'][number]['challengeCounts']
>

export type Project = components['schemas']['org.maproulette.framework.model.Project'] & {
  /**
   * The owning team's image, derived server-side from `ownerTeamId`. Absent
   * when no team owns the project.
   */
  avatarUrl?: string | null
  challengeCounts?: ProjectChallengeCounts
}
