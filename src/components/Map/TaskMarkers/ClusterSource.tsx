import { Layer, Source } from 'react-map-gl/maplibre'
import {
  clusterCountLayer,
  clusterLayer,
  selectedTaskLayer,
  unclusteredCreatedPointLayer,
  unclusteredPointLayer,
} from '@/components/Map/TaskMarkers/clusterLayers'
import { LAYER_IDS } from '@/components/Map/TaskMarkers/const'
import { useTaskMarkerResources } from '@/components/Map/TaskMarkers/useTaskMarkerResources'

interface ClusterSourceProps {
  clusteredData: GeoJSON.FeatureCollection
  /** Optional 1-feature collection for the selected (popup-open) task, drawn on
   *  top at 1.4x. */
  selectedTaskData?: GeoJSON.FeatureCollection
}

export const ClusterSource = ({ clusteredData, selectedTaskData }: ClusterSourceProps) => {
  useTaskMarkerResources()

  return (
    <>
      <Source id={LAYER_IDS.source} type="geojson" data={clusteredData}>
        <Layer key="clusters" {...clusterLayer} />
        <Layer key="cluster-count" {...clusterCountLayer} />
        {/* Paint order: base markers -> Created markers. Bundled/primary/selected
            markers stay in these layers and are styled from their properties. */}
        <Layer key="points" {...unclusteredPointLayer} />
        {/* Rendered AFTER the non-Created layer so Created markers always sit on top. */}
        <Layer key="points-created" {...unclusteredCreatedPointLayer} />
      </Source>

      {/* Selected (popup-open) task overlay — only the non-bundle maps pass this.
          The task-edit map styles selection in place on the base layers. */}
      {selectedTaskData && selectedTaskData.features.length > 0 && (
        <Source id={LAYER_IDS.selected} type="geojson" data={selectedTaskData}>
          <Layer key="selected" {...selectedTaskLayer} />
        </Source>
      )}
    </>
  )
}
