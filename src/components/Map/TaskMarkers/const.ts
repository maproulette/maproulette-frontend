// TODO: use the app's status colors here once the map gets a design pass
export const MARKER_STATUS_HEX: Record<number, string> = {
  0: '#22d3ee',
  1: '#22c55e',
  2: '#facc15',
  3: '#22d3ee',
  4: '#ef4444',
  5: '#fb923c',
  6: '#ef4444',
  7: '#a855f7',
  8: '#10b981',
  9: '#5f7697',
}

export const STATUS_CONFIG = Object.fromEntries(
  Object.entries(MARKER_STATUS_HEX).map(([key, color]) => [key, { color }])
) as Record<number, { color: string }>

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

// Client-side cluster radius, in CSS pixels, for the GeoJSON sources that
// cluster task markers. On Explore this clusters the *task-level* features the
// backend serves from z=12 up (group_type 0 and 1); the cluster markers it
// serves below that (group_type 2) arrive pre-clustered and are drawn as-is. 64
// matches the backend's own minimum marker spacing (MIN_SEPARATION_PX in
// TileAggregateRepository.scala), which is set so the bubbles above -- up to 54
// px across -- never overlap.
export const CLUSTER_RADIUS_PX = 64
