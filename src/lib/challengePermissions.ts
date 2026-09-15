import { getParentId } from '@/lib/challengeParent'
import type { Challenge } from '@/types/Challenge'
import type { User } from '@/types/User'

// Grant role constants (mirrors backend org.maproulette.framework.model.Grant)
const ROLE_SUPER_USER = -1
const ROLE_ADMIN = 1
const ROLE_WRITE_ACCESS = 2

export const canManageChallenge = (
  user: User | null | undefined,
  challenge: Challenge | null | undefined
): boolean => {
  if (!user || !challenge) return false

  if (user.osmProfile?.id != null && user.osmProfile.id === challenge.owner) return true

  const grants = user.grants ?? []
  if (grants.some((g) => g.role === ROLE_SUPER_USER)) return true

  // Endpoints disagree on whether `parent` is the project id or the embedded
  // project, so normalize before comparing it against a grant's target.
  const parentId = getParentId(challenge.parent)
  if (parentId !== undefined) {
    const hasProjectGrant = grants.some(
      (g) =>
        g.target?.objectId === parentId && (g.role === ROLE_ADMIN || g.role === ROLE_WRITE_ACCESS)
    )
    if (hasProjectGrant) return true
  }

  return false
}
