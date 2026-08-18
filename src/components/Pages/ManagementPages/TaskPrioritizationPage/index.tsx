import { useMemo } from 'react'
import { api } from '@/api'
import { processMarkersData } from '@/components/Map/TaskMarkers/utils'
import { DrawerPortalProvider } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import { TaskPriority, type TaskPriorityValue } from '@/types/Priority'
import { PrioritizationContent } from './PrioritizationContent'
import { type PrioritizationDraft, PrioritizationProvider } from './PrioritizationContext'
import { parseBoundsString, parseRulesString } from './prioritizationParsing'
import { TaskPreviewProvider } from './TaskPreviewContext'

interface Props {
  challengeId: number
}

const clampPriority = (value: number | null | undefined): TaskPriorityValue => {
  if (value === 0 || value === 1 || value === 2) return value as TaskPriorityValue
  return TaskPriority.MEDIUM
}

export const TaskPrioritizationPage = ({ challengeId }: Props) => {
  const { t } = useIntl()
  const challengeQuery = api.challenge.getChallenge(challengeId)
  const markersQuery = api.challenge.getChallengeTaskMarkers(challengeId)

  const initialDraft = useMemo<PrioritizationDraft | null>(() => {
    const challenge = challengeQuery.data
    if (!challenge) return null
    return {
      defaultPriority: clampPriority(challenge.defaultPriority),
      high: {
        rules: parseRulesString(challenge.highPriorityRule),
        bounds: parseBoundsString(challenge.highPriorityBounds),
      },
      medium: {
        rules: parseRulesString(challenge.mediumPriorityRule),
        bounds: parseBoundsString(challenge.mediumPriorityBounds),
      },
      low: {
        rules: parseRulesString(challenge.lowPriorityRule),
        bounds: parseBoundsString(challenge.lowPriorityBounds),
      },
    }
  }, [challengeQuery.data])

  const markers = useMemo(() => {
    const data = markersQuery.data
    if (!data) return []
    const { markers: m, overlapMarkers } = processMarkersData(data)
    // Flatten overlap markers so every task participates in preview evaluation.
    const flatOverlap = overlapMarkers.flatMap((o) => o.tasks)
    return [...m, ...flatOverlap]
  }, [markersQuery.data])

  if (challengeQuery.isLoading || !initialDraft) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (challengeQuery.isError || !challengeQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <p className="text-red-600 dark:text-red-400">
          {t('taskPrioritizationPage.index.loadError', undefined, 'Could not load challenge.')}
        </p>
      </div>
    )
  }

  // Key forces provider remount when draft shape changes (e.g. after save invalidates query)
  const providerKey = `${challengeId}:${challengeQuery.data.modified ?? challengeQuery.data.id}`

  return (
    <PrioritizationProvider key={providerKey} initialDraft={initialDraft}>
      <TaskPreviewProvider
        markers={markers}
        isLoading={markersQuery.isLoading}
        challengeId={challengeId}
      >
        <DrawerPortalProvider>
          <PrioritizationContent
            challengeId={challengeId}
            challengeName={challengeQuery.data.name}
          />
        </DrawerPortalProvider>
      </TaskPreviewProvider>
    </PrioritizationProvider>
  )
}
