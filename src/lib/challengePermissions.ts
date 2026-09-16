import { getParentId } from '@/lib/challengeParent'
import {
  effectiveChallengeRole,
  effectiveProjectRole,
  isSuperUser,
  ROLE_WRITE_ACCESS,
} from '@/lib/grantRoles'
import type { Challenge } from '@/types/Challenge'
import type { User } from '@/types/User'

/**
 * Whether the user may manage this challenge, by any of the routes the server
 * recognises: they own it, they hold a role on the challenge itself, a team
 * they run is attached to it or owns it, or they hold a role on the parent
 * project.
 *
 * Kept in step with Permission.effectiveRole on the server. Being wrong in the
 * lenient direction offers a control the server then refuses; being wrong in
 * the strict direction hides work someone is entitled to.
 */
export const canManageChallenge = (
  user: User | null | undefined,
  challenge: Challenge | null | undefined
): boolean => {
  if (!user || !challenge) return false

  if (user.osmProfile?.id != null && user.osmProfile.id === challenge.owner) return true
  if (isSuperUser(user)) return true

  const onChallenge = effectiveChallengeRole(user, challenge)
  if (onChallenge != null && onChallenge <= ROLE_WRITE_ACCESS) return true

  // Endpoints disagree on whether `parent` is the project id or the embedded
  // project, so normalize before comparing it against a grant's target.
  const parentId = getParentId(challenge.parent)
  const onProject = effectiveProjectRole(user, parentId)

  return onProject != null && onProject <= ROLE_WRITE_ACCESS
}
