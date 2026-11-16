/**
 * @vitest-environment happy-dom
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

const requestFitBounds = vi.fn()

const contextValue: {
  locationGeojson: unknown
  locationName: string | undefined
  requestFitBounds: typeof requestFitBounds
} = {
  locationGeojson: null,
  locationName: undefined,
  requestFitBounds,
}

vi.mock('../contexts/ExploreChallengesSearchContext', () => ({
  useExploreChallengesSearchContext: () => contextValue,
}))
vi.mock('@/i18n', async () => {
  const { testT } = await import('@/test/translate')
  return { useIntl: () => ({ t: testT }) }
})

const { LocationIndicator } = await import('./LocationIndicator')

const polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-112.1, 40.7],
      [-111.74, 40.7],
      [-111.74, 40.85],
      [-112.1, 40.85],
      [-112.1, 40.7],
    ],
  ],
}

describe('LocationIndicator', () => {
  let container: HTMLDivElement
  let root: Root

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    contextValue.locationGeojson = null
    contextValue.locationName = undefined
    requestFitBounds.mockClear()
  })

  const mount = (ui: ReactNode) => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root.render(ui)
    })
  }

  it('names the outlined area when one is drawn', () => {
    contextValue.locationGeojson = polygon
    contextValue.locationName = 'Iceland'

    mount(<LocationIndicator />)

    expect(container.textContent).toContain('Iceland')
    // The full phrase is the button's accessible name, and its tooltip.
    const button = container.querySelector('button')
    expect(button?.getAttribute('title')).toBe('Recenter on the outlined area: Iceland')
    expect(button?.getAttribute('aria-label')).toBe('Recenter on the outlined area: Iceland')
  })

  it('recenters on the outline when clicked', () => {
    contextValue.locationGeojson = polygon
    contextValue.locationName = 'Salt Lake City'

    mount(<LocationIndicator />)
    act(() => {
      container.querySelector('button')?.click()
    })

    // The polygon's own bounds as a west,south,east,north string -- the same
    // request the location search makes when the place is first picked.
    expect(requestFitBounds).toHaveBeenCalledWith('-112.1,40.7,-111.74,40.85')
  })

  it('renders nothing when no area is outlined', () => {
    contextValue.locationName = 'Iceland'

    mount(<LocationIndicator />)

    // A name with no polygon means nothing is drawn to label -- claiming an
    // outlined area then would be a lie.
    expect(container.textContent).toBe('')
  })

  it('renders nothing when the outline has no resolved name yet', () => {
    contextValue.locationGeojson = polygon

    mount(<LocationIndicator />)

    expect(container.textContent).toBe('')
  })
})
