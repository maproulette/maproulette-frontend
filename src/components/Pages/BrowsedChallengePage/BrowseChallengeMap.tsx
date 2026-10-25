import { useMemo, useState } from 'react'
import { api } from '@/api'
import { resolveMapStyle } from '@/components/Map/basemap'
import { ChallengeTasksMap } from '@/components/Map/ChallengeTasksMap'
import { flattenTaskMarkers } from '@/components/Map/TaskMarkers/utils'
import { useAuthContext } from '@/contexts/AuthContext'
import { useBrowsedChallengeContext } from './contexts/BrowsedChallengeContext'

export const BrowseChallengeMap = () => {
  const { challenge } = useBrowsedChallengeContext()
  const { user } = useAuthContext()
  // Same precedence as the task map: challenge basemap, then the mapper's
  // own default, then the style they last picked.
  const [mapStyle] = useState(() => resolveMapStyle(challenge, user?.settings))
  const { data, isLoading } = api.challenge.getChallengeTaskMarkers(challenge.id)
  const markers = useMemo(() => flattenTaskMarkers(data), [data])

  return (
    <ChallengeTasksMap
      markers={markers}
      isLoading={isLoading}
      mapStyle={mapStyle}
      hash
      fitDuration={1000}
    />
  )
}
