import type { components } from './openApiTypes'

export type Project = components['schemas']['org.maproulette.framework.model.Project'] & {
  /**
   * The owning team's image, derived server-side from `ownerTeamId`. Absent
   * when no team owns the project.
   */
  avatarUrl?: string | null
}
