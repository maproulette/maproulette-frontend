import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '@/api'
import type { Project } from '@/types/Project'

export const useProjectChallengeCounts = (projects: Project[] | undefined) => {
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
    enabled: projectIds.length > 0,
  })

  return useMemo(() => {
    const map: Record<number, number> = {}
    for (const c of challengesListing) {
      const pid = c.parent
      map[pid] = (map[pid] ?? 0) + 1
    }
    return map
  }, [challengesListing])
}
