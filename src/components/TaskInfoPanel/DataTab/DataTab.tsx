import { Box, MapPin } from 'lucide-react'
import { useIntl } from '@/i18n'
import { DataSection } from './DataSection'
import { GeoJsonSection } from './GeoJsonSection'
import { OsmFeatureSection } from './OsmFeatureSection'

export const DataTab = () => {
  const { t } = useIntl()

  return (
    <div className="space-y-2">
      <DataSection
        icon={Box}
        title={t('taskInfoPanel.data.osmFeature', undefined, 'OSM feature')}
        defaultOpen
      >
        <OsmFeatureSection />
      </DataSection>

      <DataSection icon={MapPin} title={t('common.geojson', undefined, 'GeoJSON')}>
        <GeoJsonSection />
      </DataSection>
    </div>
  )
}
