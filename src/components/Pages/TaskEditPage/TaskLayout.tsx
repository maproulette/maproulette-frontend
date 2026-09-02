import type { ReactNode } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { CompletionResponsesProvider } from '@/contexts/CompletionResponsesContext'
import { ChallengeProvider } from './contexts/ChallengeContext'
import { OSMDataProvider } from './contexts/OSMDataContext'
import { PanelViewProvider } from './contexts/PanelViewContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { TaskBundleProvider } from './contexts/TaskBundleContext'
import { TaskProvider, useTaskContext } from './contexts/TaskContext'
import { TaskMapProvider } from './contexts/TaskMapContext'
import { TaskEditMapProvider } from './TaskMap/TaskEditMapContext'
import { useLassoEvents } from './TaskMap/useLassoEvents'

const LassoEventsInitializer = () => {
  useLassoEvents()
  return null
}

/**
 * Composes the contexts the task editor needs. This must be rendered *inside*
 * the `/_app/tasks/$taskId/` route component, not the parent layout route, or
 * else the page will crash because useLoaderData will return undefined.
 */
// Seeds the mapper's form-field answers from whatever is already stored on the
// task, and starts fresh when they move to a different task.
const CompletionResponsesForTask = ({ children }: { children: ReactNode }) => {
  const { task } = useTaskContext()
  return (
    <CompletionResponsesProvider key={task.id} initial={task.completionResponses}>
      {children}
    </CompletionResponsesProvider>
  )
}

export const TaskProviders = ({ children }: { children: ReactNode }) => {
  return (
    <TaskProvider>
      <CompletionResponsesForTask>
        <ChallengeProvider>
          <ProjectProvider>
            <MapProvider>
              <TaskMapProvider>
                {/* TaskBundleProvider derives drawer/selection state from TaskMapContext
                  (e.g. selectedMarker), so it must be nested inside TaskMapProvider. */}
                <TaskBundleProvider>
                  <OSMDataProvider>
                    <TaskEditMapProvider>
                      <LassoEventsInitializer />
                      <PanelViewProvider>{children}</PanelViewProvider>
                    </TaskEditMapProvider>
                  </OSMDataProvider>
                </TaskBundleProvider>
              </TaskMapProvider>
            </MapProvider>
          </ProjectProvider>
        </ChallengeProvider>
      </CompletionResponsesForTask>
    </TaskProvider>
  )
}
