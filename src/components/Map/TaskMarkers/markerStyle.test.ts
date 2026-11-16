import { describe, expect, it } from 'vitest'
import type { TaskMarker } from '@/types/Task'
import { markerIcon } from './createMarkerIcons'
import { emphasizedPinStyle, statusPinIcon, statusPinStyle } from './markerStyle'
import { markersBounds } from './useFitToMarkers'

const marker = (overrides: Partial<TaskMarker> = {}): TaskMarker => ({
  id: 1,
  location: { lng: 10, lat: 20 },
  status: 0,
  priority: 1,
  ...overrides,
})

describe('statusPinStyle', () => {
  it('names a pin the lazy icon factory knows how to draw', () => {
    const { icon } = statusPinStyle(marker({ status: 3, priority: 2 }))
    expect(icon).toBe('marker-pin-3-2')
    expect(markerIcon(icon)).not.toBeNull()
  })

  it('dims tasks that are no longer workable', () => {
    expect(statusPinStyle(marker({ status: 0 })).opacity).toBe(1)
    expect(statusPinStyle(marker({ status: 6 })).opacity).toBe(1)
    expect(statusPinStyle(marker({ status: 1 })).opacity).toBe(0.4)
  })
})

describe('emphasizedPinStyle', () => {
  it.each([
    'primary',
    'bundled',
    'bundled-selected',
    'selected',
    'lasso',
    'lasso-selected',
    'hovered',
  ] as const)('names a drawable %s pin', (emphasis) => {
    const { icon } = emphasizedPinStyle(marker(), emphasis)
    expect(icon).toBe(statusPinIcon(marker(), emphasis))
    expect(markerIcon(icon)).not.toBeNull()
  })

  it('enlarges emphasized pins, except a plain lasso selection', () => {
    expect(emphasizedPinStyle(marker(), 'selected').size).toBe(1.4)
    expect(emphasizedPinStyle(marker(), 'lasso').size).toBe(1)
  })
})

describe('markersBounds', () => {
  it('spans every marker with a usable location', () => {
    expect(
      markersBounds([
        marker({ location: { lng: -5, lat: 40 } }),
        marker({ location: { lng: 12, lat: -3 } }),
        marker({ location: { lng: Number.NaN, lat: 0 } }),
      ])
    ).toEqual([-5, -3, 12, 40])
  })

  it('has no bounds without markers to span', () => {
    expect(markersBounds([])).toBeNull()
  })
})
