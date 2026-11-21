import { ExternalLink, MapPin } from 'lucide-react'
import { osmServerUrl } from '@/api/osm'
import { useIntl } from '@/i18n'
import type { Task } from '@/types/Task'
import { parseOsmFeatureFromTask } from '../taskUtils/osmUtils'

/** Zoom the OSM history map opens at: wide enough to cover the task's surroundings. */
const HISTORY_ZOOM = 16

const linkCardClass =
  'stretched-link-container flex items-center justify-between gap-2 rounded bg-muted p-2 transition-colors hover:bg-muted-strong'

/**
 * Recent changesets around the task, which is how a mapper tells whether
 * someone has already touched the area. Location-based rather than element
 * based, so it shows even when the task references no OSM element.
 */
const AreaHistory = ({ task }: { task: Task }) => {
  const { t } = useIntl()

  const coordinates = task.location?.coordinates
  if (!coordinates) return null

  const [lon, lat] = coordinates
  const location = `${lat.toFixed(4)}, ${lon.toFixed(4)}`

  return (
    <div>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-link" />
        <span className="font-medium text-fg text-sm">
          {t({ id: 'taskInfoPanel.data.areaHistory', defaultMessage: 'Area History' })}
        </span>
      </div>
      <p className="mt-1 mb-2 text-fg-muted text-xs">
        {t({
          id: 'taskInfoPanel.data.areaHistoryDescription',
          defaultMessage: 'View recent changes in the area around this task',
        })}
      </p>
      <div className={linkCardClass}>
        <div>
          <div className="font-medium text-link text-sm">
            <a
              href={`${osmServerUrl}/history#map=${HISTORY_ZOOM}/${lat}/${lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="stretched-link"
            >
              {t({
                id: 'taskInfoPanel.data.osmHistoryAtLocation',
                defaultMessage: 'OSM History at Location',
              })}
            </a>
          </div>
          <div className="mt-0.5 text-fg-muted text-xs">
            {t(
              {
                id: 'taskInfoPanel.data.recentEditsNear',
                defaultMessage: 'Recent edits near {location}',
              },
              { location }
            )}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-fg-subtle" />
      </div>
    </div>
  )
}

export const OsmFeatureSection = ({ task }: { task: Task }) => {
  const { t } = useIntl()
  const osmFeature = parseOsmFeatureFromTask(task)
  const osmServer = osmServerUrl

  return (
    <div className="space-y-4">
      {osmFeature ? (
        <div className={linkCardClass}>
          <div>
            <div className="font-medium text-link text-sm">
              <a
                href={`${osmServer}/${osmFeature.type}/${osmFeature.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="stretched-link"
              >
                {osmFeature.type}/{osmFeature.id}
              </a>
            </div>
            <div className="mt-0.5 text-fg-muted text-xs">
              {t(
                {
                  id: 'taskInfoPanel.data.viewOnOsm',
                  defaultMessage: 'View {type} on OpenStreetMap',
                },
                { type: osmFeature.type }
              )}
            </div>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-fg-subtle" />
        </div>
      ) : (
        <p className="text-fg-muted text-xs">
          {t({
            id: 'taskInfoPanel.data.noOsmFeature',
            defaultMessage:
              'This task\'s geometry does not reference an OSM element (like @id: "way/12345").',
          })}
        </p>
      )}

      <AreaHistory task={task} />
    </div>
  )
}
