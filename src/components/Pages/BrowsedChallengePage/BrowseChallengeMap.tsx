import { Map as MapIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '@/api'
import { resolveMapStyle } from '@/components/Map/basemap'
import { ChallengeTasksMap } from '@/components/Map/ChallengeTasksMap'
import { flattenTaskMarkers } from '@/components/Map/TaskMarkers/utils'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIsDesktopLayoutContext } from '@/contexts/LayoutContext'
import { useMapToggle } from '@/contexts/MapToggleContext'
import { useIntl } from '@/i18n'
import { useBrowsedChallengeContext } from './contexts/BrowsedChallengeContext'

export const BrowseChallengeMap = () => {
  const { challenge } = useBrowsedChallengeContext()
  const { user } = useAuthContext()
  const { t } = useIntl()
  const isDesktop = useIsDesktopLayoutContext()
  const { setShowMap } = useMapToggle()
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
      topLeftControls={
        !isDesktop && (
          <Button
            variant="outline"
            onClick={() => setShowMap(false)}
            className="h-10 gap-2 bg-white/95 shadow-sm backdrop-blur-sm dark:bg-slate-900/95"
          >
            <MapIcon className="size-4" />
            {t({ id: 'browsedChallengePage.footer.hideMap', defaultMessage: 'Hide Map' })}
          </Button>
        )
      }
    />
  )
}
