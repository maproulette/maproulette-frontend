import { ExternalLink, MapPin } from 'lucide-react'
import { api } from '@/api'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useIntl } from '@/i18n'
import { parseOsmFeatureFromTask } from '../taskUtils/osmUtils'

/** Zoom the OSM history map opens at: wide enough to cover the task's surroundings. */
const HISTORY_ZOOM = 16

const linkCardClass =
  'flex items-center justify-between gap-2 rounded bg-zinc-100 p-2 transition-colors hover:bg-zinc-200 dark:bg-slate-800/50 dark:hover:bg-slate-800'

/**
 * Recent changesets around the task, which is how a mapper tells whether
 * someone has already touched the area. Location-based rather than element
 * based, so it shows even when the task references no OSM element.
 */
const AreaHistory = () => {
  const { t } = useIntl()
  const { task } = useTaskContext()

  const coordinates = task.location?.coordinates
  if (!coordinates) return null

  const [lon, lat] = coordinates
  const location = `${lat.toFixed(4)}, ${lon.toFixed(4)}`

  return (
    <div>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-sm text-zinc-900 dark:text-white">
          {t('taskInfoPanel.data.areaHistory', undefined, 'Area History')}
        </span>
      </div>
      <p className="mt-1 mb-2 text-xs text-zinc-500 dark:text-slate-400">
        {t(
          'taskInfoPanel.data.areaHistoryDescription',
          undefined,
          'View recent changes in the area around this task'
        )}
      </p>
      <a
        href={`${api.osm.getOSMServerUrl()}/history#map=${HISTORY_ZOOM}/${lat}/${lon}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkCardClass}
      >
        <div>
          <div className="font-medium text-blue-600 text-sm dark:text-blue-400">
            {t('taskInfoPanel.data.osmHistoryAtLocation', undefined, 'OSM History at Location')}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-slate-400">
            {t('taskInfoPanel.data.recentEditsNear', { location }, 'Recent edits near {location}')}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 dark:text-slate-500" />
      </a>
    </div>
  )
}

export const OsmFeatureSection = () => {
  const { t } = useIntl()
  const { task } = useTaskContext()
  const osmFeature = parseOsmFeatureFromTask(task)
  const osmServer = api.osm.getOSMServerUrl()

  return (
    <div className="space-y-4">
      {osmFeature ? (
        <a
          href={`${osmServer}/${osmFeature.type}/${osmFeature.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={linkCardClass}
        >
          <div>
            <div className="font-medium text-blue-600 text-sm dark:text-blue-400">
              {osmFeature.type}/{osmFeature.id}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-slate-400">
              {t(
                'taskInfoPanel.data.viewOnOsm',
                { type: osmFeature.type },
                'View {type} on OpenStreetMap'
              )}
            </div>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 dark:text-slate-500" />
        </a>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-slate-400">
          {t(
            'taskInfoPanel.data.noOsmFeature',
            undefined,
            'This task\'s geometry does not reference an OSM element (like @id: "way/12345").'
          )}
        </p>
      )}

      <AreaHistory />
    </div>
  )
}
