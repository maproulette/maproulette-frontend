import { describe, expect, it } from 'vitest'
import type { TaskMarker } from '@/types/Task'
import { getTasksInPolygon } from './lassoUtils'

const marker = (overrides: Partial<TaskMarker> = {}): TaskMarker => ({
  id: 1,
  location: { lat: 0, lng: 0 },
  status: 0,
  priority: 0,
  ...overrides,
})

// A square polygon spanning (0,0) to (10,10) in [lng, lat] space.
const squarePolygon: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ],
  ],
}

describe('getTasksInPolygon', () => {
  it('excludes a task with no location field', () => {
    const noLocationMarker = { id: 99, status: 0, priority: 0 } as unknown as TaskMarker

    const result = getTasksInPolygon([noLocationMarker], squarePolygon)

    expect(result).toEqual([])
  })

  it('includes a task located inside the polygon', () => {
    const inside = marker({ id: 1, location: { lat: 5, lng: 5 } })

    const result = getTasksInPolygon([inside], squarePolygon)

    expect(result).toEqual([1])
  })

  it('excludes a task located outside the polygon', () => {
    const outside = marker({ id: 2, location: { lat: 50, lng: 50 } })

    const result = getTasksInPolygon([outside], squarePolygon)

    expect(result).toEqual([])
  })

  it('returns only the ids of matching tasks when mixing inside, outside, and locationless markers', () => {
    const inside = marker({ id: 1, location: { lat: 1, lng: 1 } })
    const outside = marker({ id: 2, location: { lat: 100, lng: 100 } })
    const noLocation = { id: 3, status: 0, priority: 0 } as unknown as TaskMarker

    const result = getTasksInPolygon([inside, outside, noLocation], squarePolygon)

    expect(result).toEqual([1])
  })
})
