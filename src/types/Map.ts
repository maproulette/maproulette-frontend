/**
 * A 2D geographic bounding box in canonical [west, south, east, north] order.
 *
 * Mirrors GeoJSON.BBox from `@types/geojson`, but restricted to 2D (the GeoJSON
 * spec also permits a six-element form for 3D bounds that include min/max
 * elevation, but MapRoulette only ever uses 2D geometries)
 *
 * Compatible with MapLibre's `LngLatBoundsLike`, so you can pass a BBox2D into
 * map.fitBounds() and similar functions.
 */
export type Bbox2D = [west: number, south: number, east: number, north: number]
