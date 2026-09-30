import type * as maplibregl from 'maplibre-gl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PRIORITY_COLOR, PRIORITY_LABEL } from '@/types/Priority'
import {
  createPriorityMarkerIcons,
  PRIORITY_PIN_PREFIX,
  priorityPinName,
} from './createPriorityMarkerIcons'

/** Minimal structural stand-in for the browser `Image` constructor. Lets the
 * test control exactly when `onload` fires instead of depending on a real
 * image decoder being available in the test environment. */
class FakeImage {
  onload: (() => void) | null = null
  src = ''
  width: number
  height: number

  constructor(width?: number, height?: number) {
    this.width = width ?? 0
    this.height = height ?? 0
  }
}

let images: FakeImage[] = []

const makeFakeMap = (loadedNames: Set<string> = new Set()) => {
  const addImage = vi.fn()
  const hasImage = vi.fn((name: string) => loadedNames.has(name))
  return {
    addImage,
    hasImage,
  } as unknown as maplibregl.Map & { addImage: typeof addImage; hasImage: typeof hasImage }
}

beforeEach(() => {
  images = []
  vi.stubGlobal(
    'Image',
    class extends FakeImage {
      constructor(width?: number, height?: number) {
        super(width, height)
        images.push(this)
      }
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('priorityPinName', () => {
  it('namespaces the pin name with the shared prefix', () => {
    expect(priorityPinName(0)).toBe(`${PRIORITY_PIN_PREFIX}-0`)
    expect(priorityPinName(1)).toBe(`${PRIORITY_PIN_PREFIX}-1`)
    expect(priorityPinName(2)).toBe(`${PRIORITY_PIN_PREFIX}-2`)
  })
})

describe('createPriorityMarkerIcons', () => {
  it('creates one Image per tier when none are already registered', () => {
    const map = makeFakeMap()

    createPriorityMarkerIcons(map)

    expect(images).toHaveLength(3)
  })

  it('encodes each tier color and label letter into the generated SVG data URI', () => {
    const map = makeFakeMap()

    createPriorityMarkerIcons(map)

    images.forEach((img, i) => {
      const priority = i as 0 | 1 | 2
      expect(img.src.startsWith('data:image/svg+xml;base64,')).toBe(true)
      const svg = atob(img.src.replace('data:image/svg+xml;base64,', ''))
      expect(svg).toContain(PRIORITY_COLOR[priority].hex)
      expect(svg).toContain(`>${PRIORITY_LABEL[priority][0]}<`)
    })
  })

  it('adds the image to the map with the correct name and pixelRatio once it loads', () => {
    const map = makeFakeMap()

    createPriorityMarkerIcons(map)
    images[0].onload?.()

    expect(map.addImage).toHaveBeenCalledTimes(1)
    expect(map.addImage).toHaveBeenCalledWith(priorityPinName(0), images[0], { pixelRatio: 4 })
  })

  it('skips creating an Image for tiers whose icon is already registered', () => {
    const map = makeFakeMap(new Set([priorityPinName(0), priorityPinName(1)]))

    createPriorityMarkerIcons(map)

    // Only the (unregistered) low tier should have created a real Image.
    expect(images).toHaveLength(1)
  })

  it('does not re-add an image that became registered between construction and load', () => {
    const map = makeFakeMap()

    createPriorityMarkerIcons(map)
    // Simulate another code path registering the image before this one's
    // onload fires (e.g. a concurrent style reload).
    map.hasImage = vi.fn(() => true)
    images[0].onload?.()

    expect(map.addImage).not.toHaveBeenCalled()
  })

  it('calls onComplete exactly once after every tier has loaded', () => {
    const map = makeFakeMap()
    const onComplete = vi.fn()

    createPriorityMarkerIcons(map, onComplete)
    expect(onComplete).not.toHaveBeenCalled()

    images[0].onload?.()
    expect(onComplete).not.toHaveBeenCalled()
    images[1].onload?.()
    expect(onComplete).not.toHaveBeenCalled()
    images[2].onload?.()

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete once when every tier is already registered (no Image objects created)', () => {
    const map = makeFakeMap(new Set([priorityPinName(0), priorityPinName(1), priorityPinName(2)]))
    const onComplete = vi.fn()

    createPriorityMarkerIcons(map, onComplete)

    expect(images).toHaveLength(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete once for a mix of already-registered and newly-loaded tiers', () => {
    const map = makeFakeMap(new Set([priorityPinName(1)]))
    const onComplete = vi.fn()

    createPriorityMarkerIcons(map, onComplete)

    // High and low still need to load.
    expect(images).toHaveLength(2)
    images[0].onload?.()
    expect(onComplete).not.toHaveBeenCalled()
    images[1].onload?.()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not throw when no onComplete callback is provided', () => {
    const map = makeFakeMap()

    expect(() => {
      createPriorityMarkerIcons(map)
      images.forEach((img) => {
        img.onload?.()
      })
    }).not.toThrow()
  })
})
