import { useMemo } from 'react'
import { api } from '@/api'
import { resolveTaskTypeFromTags, type TaskTypeKey } from './taskTypes'

export const useChallengeTypes = (challengeIds: number[]): Map<number, TaskTypeKey> => {
  const validIds = useMemo(() => challengeIds.filter((id) => id > 0), [challengeIds])
  const { data: tagsByChallenge } = api.challenge.getChallengeTagsBatch(validIds)

  return useMemo(() => {
    const result = new Map<number, TaskTypeKey>()
    tagsByChallenge?.forEach((tags, id) => {
      const typeKey = resolveTaskTypeFromTags(tags.map((t) => t.name))
      if (typeKey) result.set(id, typeKey)
    })
    return result
  }, [tagsByChallenge])
}
