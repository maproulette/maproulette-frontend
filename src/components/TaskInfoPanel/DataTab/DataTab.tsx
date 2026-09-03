import { Box, Braces, MapPin } from 'lucide-react'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useIntl } from '@/i18n'
import { parseFirstFeatureProperties } from '../taskUtils/geometryUtils'
import { DataSection } from './DataSection'
import { GeoJsonSection } from './GeoJsonSection'
import { OsmFeatureSection } from './OsmFeatureSection'
import { PropertiesSection } from './PropertiesSection'

export const DataTab = () => {
  const { t } = useIntl()
  const { task } = useTaskContext()
  const propertyCount = Object.keys(parseFirstFeatureProperties(task) ?? {}).length

  return (
    <div className="space-y-2">
      <DataSection
        icon={Box}
        title={t('taskInfoPanel.data.osmFeature', undefined, 'OSM feature')}
        defaultOpen
      >
        <OsmFeatureSection />
      </DataSection>

      <DataSection
        icon={Braces}
        title={t('taskInfoPanel.data.properties', undefined, 'Properties')}
        meta={String(propertyCount)}
        defaultOpen
      >
        <PropertiesSection />
      </DataSection>

      <DataSection icon={MapPin} title={t('common.geojson', undefined, 'GeoJSON')}>
        <GeoJsonSection />
      </DataSection>
    </div>
  )
}
