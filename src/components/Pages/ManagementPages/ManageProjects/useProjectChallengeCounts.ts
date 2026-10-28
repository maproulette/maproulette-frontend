import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '@/api'
import { getCompletionPercentage } from '@/hooks/useChallengeProgress'
import { isChallengeComplete } from '@/lib/challengeStatus'
import type { Project } from '@/types/Project'

export const useProjectChallengeCounts = (
  projects: Project[] | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const projectIds = useMemo(
    () => projects?.map((p) => p.id).filter((id): id is number => id != null) ?? [],
    [projects]
  )

  const challengesListingQuery = api.challenge.getChallengesListingOptions(projectIds, {
    limit: -1,
    onlyEnabled: false,
  })
  const { data: challengesListing = [] } = useQuery({
    ...challengesListingQuery,
    enabled: enabled && projectIds.length > 0,
  })

  return useMemo(() => {
    const map: Record<number, { total: number; completed: number }> = {}
    for (const c of challengesListing) {
      const counts = map[c.parent] ?? { total: 0, completed: 0 }
      const complete = isChallengeComplete(c, getCompletionPercentage(c.completionMetrics))
      map[c.parent] = {
        total: counts.total + 1,
        completed: counts.completed + (complete ? 1 : 0),
      }
    }
    return map
  }, [challengesListing])
}
