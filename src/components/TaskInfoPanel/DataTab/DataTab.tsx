import { Box, MapPin } from 'lucide-react'
import { useIntl } from '@/i18n'
import type { Task } from '@/types/Task'
import { DataSection } from './DataSection'
import { GeoJsonSection } from './GeoJsonSection'
import { OsmFeatureSection } from './OsmFeatureSection'

export const DataTab = ({ task }: { task: Task }) => {
  const { t } = useIntl()

  return (
    <div className="space-y-2">
      <DataSection
        icon={Box}
        title={t({ id: 'taskInfoPanel.data.osmFeature', defaultMessage: 'OSM feature' })}
        defaultOpen
      >
        <OsmFeatureSection task={task} />
      </DataSection>

      <DataSection icon={MapPin} title={t({ id: 'common.geojson', defaultMessage: 'GeoJSON' })}>
        <GeoJsonSection task={task} />
      </DataSection>
    </div>
  )
}
