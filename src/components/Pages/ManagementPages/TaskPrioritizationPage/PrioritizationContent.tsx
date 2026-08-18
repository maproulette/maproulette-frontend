import { useNavigate } from '@tanstack/react-router'
import { createContext, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MapRef } from 'react-map-gl/maplibre'
import { toast } from 'sonner'
import { api } from '@/api'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import { binaryToBackendJson } from '@/components/shared/TaskPropertyQueryBuilder/backendRuleShape'
import { DrawerPortalTarget, useDrawerPortal } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { TaskInfoDrawer } from '@/components/TaskInfoPanel/TaskInfoDrawer'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { PRIORITY_LABEL } from '@/types/Priority'
import type { TaskMarker } from '@/types/Task'
import { BoundsDrawControl } from './Editor/BoundsDrawControl'
import { DefaultPrioritySelect } from './Editor/DefaultPrioritySelect'
import { PriorityTierPanel } from './Editor/PriorityTierPanel'
import { PreviewLegend } from './Preview/PreviewLegend'
import { PreviewMap } from './Preview/PreviewMap'
import { TIER_TO_PRIORITY, type Tier, usePrioritizationContext } from './PrioritizationContext'

interface Props {
  challengeId: number
  challengeName?: string | null
}

const TIER_ORDER: Tier[] = ['high', 'medium', 'low']

interface PreviewMapBridgeValue {
  mapRef: React.RefObject<MapRef | null>
  mapLoaded: boolean
}

const PreviewMapBridgeContext = createContext<PreviewMapBridgeValue | null>(null)

export const PrioritizationContent = ({ challengeId, challengeName }: Props) => {
  const { t } = useIntl()
  const { draft, isDirty, reset, markSaved, setTierBounds } = usePrioritizationContext()
  const mutation = api.challenge.useUpdatePriorities()
  const navigate = useNavigate()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeTier, setActiveTier] = useState<Tier>('high')
  const [selectedTask, setSelectedTask] = useState<TaskMarker | null>(null)
  const { portalTarget } = useDrawerPortal()

  const handleSave = async () => {
    try {
      // Backend's `Challenge.isValidBounds` accepts an array of GeoJSON
      // Features OR a single Feature, but rejects FeatureCollection. Send
      // the `features` array directly so the validity check passes and the
      // bounds are persisted. Return `""` (not undefined) when there are
      // no features so the backend actually clears previously-saved bounds
      // — omitting the key would leave them untouched.
      const boundsToString = (fc: GeoJSON.FeatureCollection | null): string =>
        fc && fc.features.length > 0 ? JSON.stringify(fc.features) : ''
      await mutation.mutateAsync({
        challengeId,
        priorities: {
          defaultPriority: draft.defaultPriority,
          highPriorityRule: binaryToBackendJson(draft.high.rules),
          highPriorityBounds: boundsToString(draft.high.bounds),
          mediumPriorityRule: binaryToBackendJson(draft.medium.rules),
          mediumPriorityBounds: boundsToString(draft.medium.bounds),
          lowPriorityRule: binaryToBackendJson(draft.low.rules),
          lowPriorityBounds: boundsToString(draft.low.bounds),
        },
      })
      markSaved()
      toast.success(t('taskPrioritizationPage.content.saveSuccess', undefined, 'Priorities saved'))
      navigate({
        to: '/manage/challenge/$challengeId',
        params: { challengeId: String(challengeId) },
      })
    } catch (error) {
      logger.error('Priority save failed', { error, challengeId })
      toast.error(
        t('taskPrioritizationPage.content.saveError', undefined, 'Could not save priorities')
      )
      throw error
    }
  }

  const activeTierBounds = draft[activeTier].bounds

  const previewMapBridgeValue = useMemo<PreviewMapBridgeValue>(
    () => ({ mapRef, mapLoaded }),
    [mapRef, mapLoaded]
  )

  return (
    <PreviewMapBridgeContext.Provider value={previewMapBridgeValue}>
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-start justify-between pb-2">
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            {t(
              'common.challengeWithChallengeId',
              {
                name:
                  challengeName ??
                  t(
                    'taskPrioritizationPage.content.challengeNumber',
                    { challengeId },
                    'Challenge #{challengeId}'
                  ),
              },
              '{name} — rules run top-down; the first tier to match wins.'
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={reset}
              disabled={!isDirty || mutation.isPending}
            >
              {t('taskPrioritizationPage.content.discard', undefined, 'Discard')}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || mutation.isPending}
              aria-disabled={!isDirty || mutation.isPending}
            >
              {mutation.isPending
                ? t('common.saving', undefined, 'Saving…')
                : t('common.save', undefined, 'Save')}
            </Button>
          </div>
        </header>

        <DefaultPrioritySelect />

        <div className="mt-2 grid min-h-[600px] flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          <div className="relative flex min-h-0 flex-col">
            <Tabs
              value={activeTier}
              onValueChange={(value) => setActiveTier(value as Tier)}
              className="flex h-full flex-col"
            >
              <TabsList className="w-full">
                {TIER_ORDER.map((tier) => (
                  <TabsTrigger key={tier} value={tier} className="flex-1">
                    {PRIORITY_LABEL[TIER_TO_PRIORITY[tier]]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {TIER_ORDER.map((tier) => (
                <TabsContent key={tier} value={tier} className="mt-3 flex-1 overflow-y-auto pr-1">
                  <PriorityTierPanel tier={tier} />
                </TabsContent>
              ))}
            </Tabs>
            <DrawerPortalTarget />
          </div>
          <div className="relative min-h-[500px]">
            <PreviewMap
              externalMapRef={mapRef}
              onMapLoaded={setMapLoaded}
              onTaskSelect={setSelectedTask}
              selectedTaskId={selectedTask?.id ?? null}
            >
              {({ cluster, setCluster }) => (
                <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
                  <BoundsDrawControl
                    tier={activeTier}
                    map={mapRef}
                    mapLoaded={mapLoaded}
                    value={activeTierBounds}
                    onChange={(next) => setTierBounds(activeTier, next)}
                  />
                  <ClusterToggle clusteringEnabled={cluster} onToggle={setCluster} inline />
                  <div className="pointer-events-none">
                    <PreviewLegend />
                  </div>
                </div>
              )}
            </PreviewMap>
          </div>
        </div>

        {portalTarget &&
          createPortal(
            <TaskInfoDrawer
              selectedTask={selectedTask}
              onClose={() => setSelectedTask(null)}
              mapRef={mapRef}
            />,
            portalTarget
          )}
      </div>
    </PreviewMapBridgeContext.Provider>
  )
}
