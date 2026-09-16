import type { CompletionMetrics } from './Challenge'
import type { components, paths } from './openApiTypes'

/* Responses */
export type ProjectGetResponse =
  paths['/project/{id}']['get']['responses']['200']['content']['application/json']

/* Types From API (isArchived supported by API but not in generated schema) */
export type Project = components['schemas']['Project'] & {
  isArchived?: boolean
  completionMetrics?: CompletionMetrics
  /**
   * The image of the team managing this project, derived server-side from the
   * project's grants the way a challenge's is derived from its owning team.
   * Absent when no team manages the project.
   */
  avatarUrl?: string | null
}
