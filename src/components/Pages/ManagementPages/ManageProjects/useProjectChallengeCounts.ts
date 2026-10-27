import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '@/api'
import type { Project } from '@/types/Project'

export interface ChallengeCounts {
  total: number
  completed: number
}

export const useProjectChallengeCounts = (projects: Project[]): Record<number, ChallengeCounts> => {
  const projectIds = projects.map((p) => p.id)

  const { data: challengesListing } = useQuery({
    ...api.challenge.getChallengesListingOptions(projectIds),
    placeholderData: keepPreviousData,
  })

  return useMemo(() => {
    const map: Record<number, ChallengeCounts> = {}
    for (const c of challengesListing ?? []) {
      const pid = c.parent

      const done =
        c.status === 5 ||
        (c.completionMetrics.total > 0 && c.completionMetrics.tasksRemaining === 0)

      map[pid] = {
        total: (map[pid]?.total ?? 0) + 1,
        completed: (map[pid]?.completed ?? 0) + (done ? 1 : 0),
      }
    }

    return map
  }, [challengesListing])
}
