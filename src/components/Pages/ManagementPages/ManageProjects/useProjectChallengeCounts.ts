import { useMemo } from 'react'
import type { Project } from '@/types/Project'

export const useProjectChallengeCounts = (projects: Project[] | undefined) =>
  useMemo(() => {
    const map: Record<number, { total: number; completed: number }> = {}
    for (const project of projects ?? []) {
      if (project.id == null) continue
      map[project.id] = {
        total: project.challengeCounts?.total ?? 0,
        completed: project.challengeCounts?.completed ?? 0,
      }
    }
    return map
  }, [projects])
