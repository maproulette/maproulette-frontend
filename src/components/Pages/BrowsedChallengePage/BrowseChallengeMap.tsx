import { useNavigate, useSearch } from '@tanstack/react-router'
import { Map as MapIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '@/api'
import { resolveMapStyle } from '@/components/Map/basemap'
import { ChallengeTasksMap } from '@/components/Map/ChallengeTasksMap'
import { MapSettingRadioGroup, MapSettingsSection } from '@/components/Map/MapSettings'
import { flattenTaskMarkers } from '@/components/Map/TaskMarkers/utils'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIsDesktopLayoutContext } from '@/contexts/LayoutContext'
import { useMapToggle } from '@/contexts/MapToggleContext'
import { useIntl } from '@/i18n'
import { useBrowsedChallengeContext } from './contexts/BrowsedChallengeContext'
import { filterMarkers, type TaskFilter } from './taskFilter'

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
  const { tasks: filter } = useSearch({ from: '/_app/challenge/$challengeId/' })
  const navigate = useNavigate({ from: '/challenge/$challengeId' })
  const markers = useMemo(() => filterMarkers(flattenTaskMarkers(data), filter), [data, filter])

  const setFilter = (value: TaskFilter | 'all') =>
    navigate({
      search: (prev) => ({ ...prev, tasks: value === 'all' ? undefined : value }),
      // The map keeps its view in the hash.
      hash: true,
      replace: true,
    })

  const shownTitle = t({ id: 'browsedChallengePage.map.tasksShown', defaultMessage: 'Tasks shown' })

  return (
    <ChallengeTasksMap
      markers={markers}
      isLoading={isLoading}
      mapStyle={mapStyle}
      hash
      fitDuration={1000}
      settings={
        <MapSettingsSection title={shownTitle}>
          <MapSettingRadioGroup
            label={shownTitle}
            value={filter ?? 'all'}
            onValueChange={setFilter}
            options={[
              {
                value: 'available',
                label: t({
                  id: 'browsedChallengePage.map.tasksAvailable',
                  defaultMessage: 'Available',
                }),
              },
              {
                value: 'completed',
                label: t({
                  id: 'browsedChallengePage.map.tasksCompleted',
                  defaultMessage: 'Completed',
                }),
              },
              {
                value: 'all',
                label: t({ id: 'browsedChallengePage.map.tasksAll', defaultMessage: 'All' }),
              },
            ]}
          />
        </MapSettingsSection>
      }
      settingsModified={!!filter}
      topLeftControls={
        !isDesktop && (
          <Button
            variant="outline"
            onClick={() => setShowMap(false)}
            className="h-10 gap-2 border-line bg-popover shadow-md"
          >
            <MapIcon className="size-4" />
            {t({ id: 'browsedChallengePage.footer.hideMap', defaultMessage: 'Hide Map' })}
          </Button>
        )
      }
    />
  )
}
