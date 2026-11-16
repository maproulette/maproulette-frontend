import { describe, expect, it } from 'vitest'
import {
  type ClusterMarkerFeature,
  clusterRadiusForCount,
  declutterClusterMarkers,
} from './clusterUtils.ts'
import { CLUSTER_CONFIG } from './const.ts'

/** A cluster marker at a longitude offset, in CSS pixels at `zoom`, from lng 0. */
const atPixelOffset = (offsetPx: number, taskCount: number, zoom = 10): ClusterMarkerFeature => ({
  geometry: { type: 'Point', coordinates: [(offsetPx / (512 * 2 ** zoom)) * 360, 0] },
  taskCount,
})

/** Pixel gap between two markers' centres, as the declutter pass measures it. */
const separationPx = (a: ClusterMarkerFeature, b: ClusterMarkerFeature, zoom = 10): number =>
  (Math.abs(a.geometry.coordinates[0] - b.geometry.coordinates[0]) / 360) * 512 * 2 ** zoom

describe('clusterRadiusForCount', () => {
  it('matches the step expression the cluster layer paints with', () => {
    expect(clusterRadiusForCount(1)).toBe(CLUSTER_CONFIG.sizes[0])
    expect(clusterRadiusForCount(CLUSTER_CONFIG.steps[0] - 1)).toBe(CLUSTER_CONFIG.sizes[0])
    // A step boundary belongs to the bucket above it, as `step` treats it.
    expect(clusterRadiusForCount(CLUSTER_CONFIG.steps[0])).toBe(CLUSTER_CONFIG.sizes[1])
    expect(clusterRadiusForCount(1_000_000)).toBe(CLUSTER_CONFIG.sizes[CLUSTER_CONFIG.steps.length])
  })
})

describe('declutterClusterMarkers', () => {
  it('keeps markers that already clear each other', () => {
    const markers = [atPixelOffset(0, 5000), atPixelOffset(200, 4000)]

    const result = declutterClusterMarkers(markers, 10)

    expect(result).toHaveLength(2)
    expect(result.map((m) => m.taskCount).sort((a, b) => a - b)).toEqual([4000, 5000])
  })

  it('drops the smaller of an overlapping pair and gives it the larger one, in place', () => {
    // 17px apart is what two markers either side of a tile seam measured on
    // production data; bubbles at these counts are 21-23px in radius.
    const big = atPixelOffset(0, 12000)
    const small = atPixelOffset(17, 800)

    const result = declutterClusterMarkers([small, big], 10)

    expect(result).toHaveLength(1)
    expect(result[0].taskCount).toBe(12800)
    expect(result[0].geometry.coordinates).toEqual(big.geometry.coordinates)
  })

  it('leaves no surviving pair of bubbles touching, and conserves the tasks', () => {
    // A dense line of markers 20px apart: far too close for bubbles of this
    // size, so most must be absorbed.
    const markers = Array.from({ length: 24 }, (_, i) => atPixelOffset(i * 20, 500 + i * 10))

    const result = declutterClusterMarkers(markers, 10)

    expect(result.length).toBeGreaterThan(1)
    expect(result.length).toBeLessThan(markers.length)
    expect(result.reduce((sum, m) => sum + m.taskCount, 0)).toEqual(
      markers.reduce((sum, m) => sum + m.taskCount, 0)
    )

    for (const a of result) {
      for (const b of result) {
        if (a === b) continue
        expect(separationPx(a, b)).toBeGreaterThanOrEqual(
          clusterRadiusForCount(a.taskCount) + clusterRadiusForCount(b.taskCount)
        )
      }
    }
  })

  it('separates the same markers at a higher zoom, where they no longer overlap', () => {
    const markers = [atPixelOffset(0, 5000), atPixelOffset(30, 4000)]

    // At zoom 10 the pair is 30px apart and overlaps; two zoom levels in it is
    // 120px apart and both survive.
    expect(declutterClusterMarkers(markers, 10)).toHaveLength(1)
    expect(declutterClusterMarkers(markers, 12)).toHaveLength(2)
  })

  it('passes a single marker and an empty list straight through', () => {
    expect(declutterClusterMarkers([], 10)).toEqual([])
    expect(declutterClusterMarkers([atPixelOffset(0, 7)], 10)).toHaveLength(1)
  })
})
