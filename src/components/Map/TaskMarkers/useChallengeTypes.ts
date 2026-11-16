import { useMemo } from 'react'
import { api } from '@/api'
import { resolveTaskTypeFromTags, type TaskTypeKey } from './taskTypes'

/**
 * Task type of each challenge whose tags have loaded. A task's value in the Map is null
 * if it is not of a known type, and is absent from the map completely if its challenge's
 * data is still loading.
 */
export const useChallengeTypes = (challengeIds: number[]): Map<number, TaskTypeKey | null> => {
  const { data: tagsByChallenge } = api.challenge.getChallengeTagsBatch(
    challengeIds.filter((id) => id > 0)
  )

  return useMemo(() => {
    const result = new Map<number, TaskTypeKey | null>()
    tagsByChallenge?.forEach((tags, id) => {
      result.set(id, resolveTaskTypeFromTags(tags.map((t) => t.name)))
    })
    return result
  }, [tagsByChallenge])
}
