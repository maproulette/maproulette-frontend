import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STATUS_CONFIG } from './const'
import { attachMarkerIcons, markerIcon, TASK_MARKER_SIZE } from './createMarkerIcons'
import { TASK_TYPE_KEYS } from './taskTypes'

const BORDERS = ['selected', 'bundled', 'primary', 'hovered', 'lasso']
const DUAL_BORDERS = ['bundled-selected', 'primary-selected', 'lasso-selected']
const SUFFIXES = ['', ...[...BORDERS, ...DUAL_BORDERS].map((s) => `-${s}`)]

describe('markerIcon', () => {
  it('builds every pin the map layers ask for', () => {
    for (const status of Object.keys(STATUS_CONFIG)) {
      for (const priority of [0, 1, 2]) {
        for (const suffix of SUFFIXES) {
          expect(markerIcon(`marker-pin-${status}-${priority}${suffix}`)?.size).toEqual(
            TASK_MARKER_SIZE
          )
        }
      }
    }
  })

  it('builds every task type pin, plain and selected', () => {
    for (const typeKey of TASK_TYPE_KEYS) {
      for (const priority of [0, 1, 2]) {
        expect(markerIcon(`marker-type-${typeKey}-${priority}`)).not.toBeNull()
        expect(markerIcon(`marker-type-${typeKey}-${priority}-selected`)).not.toBeNull()
      }
    }
  })

  it('builds overlap pins for counts and for 20+', () => {
    for (const count of [2, 9, 10, 20, 'many']) {
      for (const suffix of SUFFIXES) {
        expect(markerIcon(`marker-overlap-${count}${suffix}`)?.size).toEqual({
          width: 32,
          height: 44,
        })
      }
    }
    expect(markerIcon('marker-overlap-many')?.svg).toContain('20+')
    expect(markerIcon('marker-overlap-12')?.svg).toContain('font-size="9"')
  })

  it('gives the selected and bundled borders their own colours', () => {
    expect(markerIcon('marker-pin-1-1-selected')?.svg).toContain('#8b5cf6')
    const dual = markerIcon('marker-pin-1-1-bundled-selected')?.svg
    expect(dual).toContain('#8b5cf6')
    expect(dual).toContain('#22c55e')
  })

  it.each([
    'marker-pin-999-1',
    'marker-pin-1-3',
    'marker-pin-1-1-sparkly',
    'marker-type--0',
    'marker-type-spaceship-1',
    'marker-type-road-1-hovered',
    'marker-overlap-5-sparkly',
    'direction-arrow',
  ])('ignores %s', (name) => {
    expect(markerIcon(name)).toBeNull()
  })
})

class FakeImage {
  static created = 0
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  readonly width: number
  readonly height: number
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    FakeImage.created++
  }
  set src(_: string) {
    queueMicrotask(() => this.onload?.())
  }
}

const fakeMap = () => {
  const images = new Map<string, unknown>()
  let listener: ((e: { id: string }) => void) | null = null
  const map = {
    on: vi.fn((_: string, fn: (e: { id: string }) => void) => {
      listener = fn
    }),
    off: vi.fn(() => {
      listener = null
    }),
    hasImage: (id: string) => images.has(id),
    addImage: vi.fn((id: string, image: unknown) => {
      images.set(id, image)
    }),
    updateImage: vi.fn((id: string, image: unknown) => {
      images.set(id, image)
    }),
    triggerRepaint: vi.fn(),
  }
  const requestImage = (id: string) => {
    if (!images.has(id)) listener?.({ id })
  }
  return { map, images, requestImage }
}

const asMap = (map: ReturnType<typeof fakeMap>['map']) => map as unknown as maplibregl.Map

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('attachMarkerIcons', () => {
  beforeEach(() => {
    FakeImage.created = 0
    vi.stubGlobal('Image', FakeImage)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('holds a blank pin-sized place for a pin straight away, then fills it in', async () => {
    const { map, images, requestImage } = fakeMap()
    attachMarkerIcons(asMap(map))
    expect(images.size).toBe(0)

    requestImage('marker-pin-3-2')

    expect(map.addImage).toHaveBeenCalledWith(
      'marker-pin-3-2',
      { width: 108, height: 144, data: new Uint8Array(108 * 144 * 4) },
      { pixelRatio: 4 }
    )

    await flush()

    expect(map.updateImage).toHaveBeenCalledWith('marker-pin-3-2', expect.any(FakeImage))
    expect(map.triggerRepaint).toHaveBeenCalled()
    expect([...images.keys()]).toEqual(['marker-pin-3-2'])
  })

  it('adds a pin it has already rendered straight away, for another map or a new style', async () => {
    const first = fakeMap()
    attachMarkerIcons(asMap(first.map))
    first.requestImage('marker-pin-4-0-lasso')
    await flush()

    const second = fakeMap()
    attachMarkerIcons(asMap(second.map))
    second.requestImage('marker-pin-4-0-lasso')

    expect(second.map.addImage).toHaveBeenCalledWith(
      'marker-pin-4-0-lasso',
      first.images.get('marker-pin-4-0-lasso'),
      { pixelRatio: 4 }
    )
    expect(second.map.updateImage).not.toHaveBeenCalled()
  })

  it('renders a pin once when two maps ask for it before it is ready', async () => {
    const first = fakeMap()
    const second = fakeMap()
    attachMarkerIcons(asMap(first.map))
    attachMarkerIcons(asMap(second.map))

    first.requestImage('marker-overlap-7-hovered')
    second.requestImage('marker-overlap-7-hovered')
    await flush()

    expect(FakeImage.created).toBe(1)
    expect(first.images.get('marker-overlap-7-hovered')).toBe(
      second.images.get('marker-overlap-7-hovered')
    )
  })

  it('leaves names it does not draw for someone else', async () => {
    const { map, requestImage } = fakeMap()
    attachMarkerIcons(asMap(map))

    requestImage('direction-arrow')
    await flush()

    expect(map.addImage).not.toHaveBeenCalled()
  })

  it('stops filling in pins once detached', async () => {
    const { map, requestImage } = fakeMap()
    const detach = attachMarkerIcons(asMap(map))

    requestImage('marker-pin-5-1-primary')
    detach()
    await flush()

    expect(map.updateImage).not.toHaveBeenCalled()
    expect(map.off).toHaveBeenCalledWith('styleimagemissing', expect.any(Function))
  })

  it('does not fill in a pin the map has since dropped with its old style', async () => {
    const { map, images, requestImage } = fakeMap()
    attachMarkerIcons(asMap(map))

    requestImage('marker-pin-6-2-selected')
    images.clear()
    await flush()

    expect(map.updateImage).not.toHaveBeenCalled()
  })
})
