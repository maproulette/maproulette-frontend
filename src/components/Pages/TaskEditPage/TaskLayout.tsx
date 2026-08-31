import type { ReactNode } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'
import { ChallengeProvider } from './contexts/ChallengeContext'
import { OSMDataProvider } from './contexts/OSMDataContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { TaskBundleProvider } from './contexts/TaskBundleContext'
import { TaskProvider } from './contexts/TaskContext'
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
export const TaskProviders = ({ children }: { children: ReactNode }) => {
  return (
    <TaskProvider>
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
                    {children}
                  </TaskEditMapProvider>
                </OSMDataProvider>
              </TaskBundleProvider>
            </TaskMapProvider>
          </MapProvider>
        </ProjectProvider>
      </ChallengeProvider>
    </TaskProvider>
  )
}
