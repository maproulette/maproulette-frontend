import { resolveHex, STATUS_HEX_COLORS, STATUS_LABELS } from '@/lib/taskConstants'

export const STATUS_CONFIG = Object.fromEntries(
  Object.entries(STATUS_HEX_COLORS).map(([key, color]) => [
    key,
    { color: resolveHex(color), label: STATUS_LABELS[Number(key)] || 'Unknown' },
  ])
) as Record<number, { color: string; label: string }>

export const CLUSTER_CONFIG = {
  maxZoom: 14,
  radius: 120, // Increased to 120 for better clustering - larger radius means markers combine from further away
  // Colors gradient from green (small) through yellow/orange to red/purple (large)
  colors: [
    '#22c55e', // < 10: green
    '#84cc16', // 10-50: lime
    '#eab308', // 50-100: yellow
    '#f97316', // 100-500: orange
    '#ef4444', // 500-1000: red
    '#dc2626', // 1000-5000: darker red
    '#b91c1c', // 5000-10000: even darker red
    '#991b1b', // 10000-50000: dark red
    '#7c2d12', // 50000-100000: brown-red
    '#581c87', // 100000-500000: purple
    '#3b0764', // > 500000: dark purple
  ],
  sizes: [15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27],
  steps: [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
}

// Client-side Supercluster radius, in pixels. This clusters the *task-level*
// features the backend serves from z=12 up (group_type 0 and 1); the cluster
// markers it serves below that (group_type 2) arrive pre-clustered and bypass
// Supercluster entirely. Supercluster's extent (512) matches MapLibre's 512px
// vector tile, so this radius is already in CSS pixels, and 64 matches the
// backend's own minimum marker spacing (MIN_SEPARATION_PX in
// TileAggregateRepository.scala), which is set so the bubbles above -- up to 54
// px across -- never overlap.
export const CLUSTER_RADIUS_PX = 64

const POINTS_LAYER_ID = 'task-unclustered-point'
const POINTS_CREATED_LAYER_ID = 'task-unclustered-point-created'

export const LAYER_IDS = {
  source: 'task-markers',
  clusters: 'task-clusters',
  clusterCount: 'task-cluster-count',
  /** Non-Created tasks (status != 0). Drawn underneath the Created layer. */
  points: POINTS_LAYER_ID,
  /** Created tasks (status == 0). Drawn on top so they're never occluded. */
  pointsCreated: POINTS_CREATED_LAYER_ID,
  /** Selected (popup-open) task overlay. Drawn on top at 1.4x. */
  selected: 'task-selected',
  /** All marker layers — use this for queryRenderedFeatures, click/hover checks,
   *  and the `interactiveLayerIds` prop. */
  allPoints: [POINTS_LAYER_ID, POINTS_CREATED_LAYER_ID] as readonly string[],
}
