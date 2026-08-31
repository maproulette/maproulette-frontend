import type { LayerProps } from 'react-map-gl/maplibre'
import { CLUSTER_CONFIG, LAYER_IDS } from '@/components/Map/TaskMarkers/const'

export const clusterLayer: LayerProps = {
  id: LAYER_IDS.clusters,
  type: 'circle',
  source: LAYER_IDS.source,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      CLUSTER_CONFIG.colors[0],
      CLUSTER_CONFIG.steps[0],
      CLUSTER_CONFIG.colors[1],
      CLUSTER_CONFIG.steps[1],
      CLUSTER_CONFIG.colors[2],
      CLUSTER_CONFIG.steps[2],
      CLUSTER_CONFIG.colors[3],
      CLUSTER_CONFIG.steps[3],
      CLUSTER_CONFIG.colors[4],
      CLUSTER_CONFIG.steps[4],
      CLUSTER_CONFIG.colors[5],
      CLUSTER_CONFIG.steps[5],
      CLUSTER_CONFIG.colors[6],
      CLUSTER_CONFIG.steps[6],
      CLUSTER_CONFIG.colors[7],
      CLUSTER_CONFIG.steps[7],
      CLUSTER_CONFIG.colors[8],
      CLUSTER_CONFIG.steps[8],
      CLUSTER_CONFIG.colors[9],
      CLUSTER_CONFIG.steps[9],
      CLUSTER_CONFIG.colors[10],
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      CLUSTER_CONFIG.sizes[0],
      CLUSTER_CONFIG.steps[0],
      CLUSTER_CONFIG.sizes[1],
      CLUSTER_CONFIG.steps[1],
      CLUSTER_CONFIG.sizes[2],
      CLUSTER_CONFIG.steps[2],
      CLUSTER_CONFIG.sizes[3],
      CLUSTER_CONFIG.steps[3],
      CLUSTER_CONFIG.sizes[4],
      CLUSTER_CONFIG.steps[4],
      CLUSTER_CONFIG.sizes[5],
      CLUSTER_CONFIG.steps[5],
      CLUSTER_CONFIG.sizes[6],
      CLUSTER_CONFIG.steps[6],
      CLUSTER_CONFIG.sizes[7],
      CLUSTER_CONFIG.steps[7],
      CLUSTER_CONFIG.sizes[8],
      CLUSTER_CONFIG.steps[8],
      CLUSTER_CONFIG.sizes[9],
      CLUSTER_CONFIG.steps[9],
      CLUSTER_CONFIG.sizes[10],
    ],
    'circle-stroke-width': 0,
    'circle-opacity': 0.9,
  },
}

export const clusterCountLayer: LayerProps = {
  id: LAYER_IDS.clusterCount,
  type: 'symbol',
  source: LAYER_IDS.source,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['to-string', ['get', 'point_count']],
    'text-font': ['Noto Sans Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
    'text-size': 14,
    'text-anchor': 'center',
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#000000',
    'text-halo-width': 1,
  },
}

export const unclusteredPointLayer: LayerProps = {
  id: LAYER_IDS.points,
  type: 'symbol',
  source: LAYER_IDS.source,
  // Non-Created tasks (status != 0). Bundled / primary / selected markers stay in
  // this layer and are styled in place from their feature properties (the
  // icon-image case below picks -bundled / -selected / -bundled-selected), so they
  // spider and cluster with every other marker. Other maps that use a selected
  // overlay simply never set these flags true, so this layer is unaffected there.
  filter: ['all', ['!', ['has', 'point_count']], ['!=', ['coalesce', ['get', 'status'], 0], 0]],
  minzoom: 2,
  maxzoom: 24,
  layout: {
    'icon-image': [
      'case',

      ['==', ['get', 'isHovered'], true],
      [
        'case',
        ['==', ['get', 'isOverlapping'], true],
        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many-hovered',
          ['concat', 'marker-overlap-', ['to-string', ['get', 'overlapTaskCount']], '-hovered'],
        ],
        [
          'concat',
          'marker-pin-',
          ['to-string', ['get', 'status']],
          '-',
          ['to-string', ['coalesce', ['get', 'priority'], 1]],
          '-hovered',
        ],
      ],

      ['==', ['get', 'isOverlapping'], true],
      [
        'case',

        ['==', ['get', 'isPrimary'], true],
        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many-primary',
          ['concat', 'marker-overlap-', ['to-string', ['get', 'overlapTaskCount']], '-primary'],
        ],

        [
          'all',
          ['==', ['get', 'isHighlighted'], true],
          ['any', ['==', ['get', 'isActive'], true], ['==', ['get', 'isSelected'], true]],
        ],
        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many-bundled-selected',
          [
            'concat',
            'marker-overlap-',
            ['to-string', ['get', 'overlapTaskCount']],
            '-bundled-selected',
          ],
        ],

        ['==', ['get', 'isHighlighted'], true],
        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many-bundled',
          ['concat', 'marker-overlap-', ['to-string', ['get', 'overlapTaskCount']], '-bundled'],
        ],

        [
          'all',
          ['==', ['get', 'isLassoSelected'], true],
          ['any', ['==', ['get', 'isActive'], true], ['==', ['get', 'isSelected'], true]],
        ],
        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many-lasso-selected',
          [
            'concat',
            'marker-overlap-',
            ['to-string', ['get', 'overlapTaskCount']],
            '-lasso-selected',
          ],
        ],

        ['any', ['==', ['get', 'isActive'], true], ['==', ['get', 'isSelected'], true]],
        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many-selected',
          ['concat', 'marker-overlap-', ['to-string', ['get', 'overlapTaskCount']], '-selected'],
        ],

        ['==', ['get', 'isLassoSelected'], true],
        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many-lasso',
          ['concat', 'marker-overlap-', ['to-string', ['get', 'overlapTaskCount']], '-lasso'],
        ],

        [
          'case',
          ['>', ['get', 'overlapTaskCount'], 20],
          'marker-overlap-many',
          ['concat', 'marker-overlap-', ['to-string', ['get', 'overlapTaskCount']]],
        ],
      ],

      ['==', ['get', 'isPrimary'], true],
      [
        'concat',
        'marker-pin-',
        ['to-string', ['get', 'status']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-primary',
      ],

      [
        'all',
        ['==', ['get', 'isHighlighted'], true],
        ['any', ['==', ['get', 'isActive'], true], ['==', ['get', 'isSelected'], true]],
      ],
      [
        'concat',
        'marker-pin-',
        ['to-string', ['get', 'status']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-bundled-selected',
      ],

      ['==', ['get', 'isHighlighted'], true],
      [
        'concat',
        'marker-pin-',
        ['to-string', ['get', 'status']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-bundled',
      ],

      [
        'all',
        ['==', ['get', 'isLassoSelected'], true],
        ['any', ['==', ['get', 'isActive'], true], ['==', ['get', 'isSelected'], true]],
      ],
      [
        'concat',
        'marker-pin-',
        ['to-string', ['get', 'status']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-lasso-selected',
      ],

      ['any', ['==', ['get', 'isActive'], true], ['==', ['get', 'isSelected'], true]],
      [
        'concat',
        'marker-pin-',
        ['to-string', ['get', 'status']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-selected',
      ],

      ['==', ['get', 'isLassoSelected'], true],
      [
        'concat',
        'marker-pin-',
        ['to-string', ['get', 'status']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-lasso',
      ],

      ['has', 'typeKey'],
      [
        'concat',
        'marker-type-',
        ['to-string', ['get', 'typeKey']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
      ],

      [
        'concat',
        'marker-pin-',
        ['to-string', ['get', 'status']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
      ],
    ],
    'icon-size': [
      'case',

      [
        'any',
        ['==', ['get', 'isHighlighted'], true],
        ['==', ['get', 'isActive'], true],
        ['==', ['get', 'isSelected'], true],
        ['==', ['get', 'isHovered'], true],
      ],
      1.4,

      1.0,
    ],
    'icon-anchor': 'bottom',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'symbol-z-order': 'viewport-y' as const,
  },
  paint: {
    'icon-opacity': [
      'case',

      ['==', ['get', 'isHovered'], true],
      1,
      ['==', ['get', 'isPrimary'], true],
      1,
      ['==', ['get', 'isHighlighted'], true],
      1,

      ['==', ['get', 'isEligibleForBundle'], false],
      0.4,

      ['match', ['coalesce', ['get', 'status'], 0], [0, 3, 6], 1, 0.4],
    ],
  },
}

// Created tasks (status == 0). Rendered after the non-Created layer (above it)
// so Created markers are never occluded; viewport-y still controls ordering
// within this group. Reuses unclusteredPointLayer's layout/paint via spread.
export const unclusteredCreatedPointLayer: LayerProps = {
  ...unclusteredPointLayer,
  id: LAYER_IDS.pointsCreated,
  filter: ['all', ['!', ['has', 'point_count']], ['==', ['coalesce', ['get', 'status'], 0], 0]],
}

// Selected (popup-open) task overlay. Rendered last, from its own 1-feature
// source, so it always sits on top at 1.4x. The icon-image keeps the type
// indicator when a typeKey is known and falls back to the status pin otherwise.
export const selectedTaskLayer: LayerProps = {
  id: LAYER_IDS.selected,
  type: 'symbol',
  source: LAYER_IDS.selected,
  layout: {
    'icon-image': [
      'case',
      ['has', 'typeKey'],
      [
        'concat',
        'marker-type-',
        ['to-string', ['get', 'typeKey']],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-selected',
      ],
      [
        'concat',
        'marker-pin-',
        ['to-string', ['coalesce', ['get', 'status'], 0]],
        '-',
        ['to-string', ['coalesce', ['get', 'priority'], 1]],
        '-selected',
      ],
    ],
    'icon-size': 1.4,
    'icon-anchor': 'bottom',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
}
