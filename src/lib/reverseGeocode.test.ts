// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetch } from '@/test/stubFetch'
import { logger } from './logger'
import { reverseGeocodePlaceName } from './reverseGeocode'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'text/plain' } })

describe('reverseGeocodePlaceName', () => {
  it('asks Nominatim for the town-level name of the point', async () => {
    const fetchMock = stubFetch(jsonResponse({ address: { city: 'Bonn', state: 'NRW' } }))

    expect(await reverseGeocodePlaceName(50.73, 7.1)).toBe('Bonn, NRW')

    // reverseGeocodePlaceName calls fetch with a URL string, not a Request.
    const url = new URL(fetchMock.mock.calls[0][0] as unknown as string)
    expect(url.pathname).toBe('/reverse')
    expect(url.searchParams.get('lat')).toBe('50.73')
    expect(url.searchParams.get('lon')).toBe('7.1')
    expect(url.searchParams.get('zoom')).toBe('10')
  })

  it('falls back through the address fields for a rural point', async () => {
    stubFetch(jsonResponse({ address: { county: 'Powys', country: 'United Kingdom' } }))

    expect(await reverseGeocodePlaceName(52.1, -3.4)).toBe('Powys, United Kingdom')
  })

  it('uses the display name when no address fields come back', async () => {
    stubFetch(jsonResponse({ display_name: 'Rural Road, Somewhere, Nowhere, 12345' }))

    expect(await reverseGeocodePlaceName(1, 2)).toBe('Rural Road, Somewhere')
  })

  it('returns null rather than throwing when the lookup fails', async () => {
    stubFetch(new Response('nope', { status: 500 }))

    expect(await reverseGeocodePlaceName(1, 2)).toBeNull()
  })

  it('returns null when fetch itself rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline')))
    )

    expect(await reverseGeocodePlaceName(1, 2)).toBeNull()
  })

  it('returns null when the response has neither address fields nor a display name', async () => {
    stubFetch(jsonResponse({}))

    expect(await reverseGeocodePlaceName(1, 2)).toBeNull()
  })

  it('returns null when the display name is blank', async () => {
    stubFetch(jsonResponse({ display_name: '' }))

    expect(await reverseGeocodePlaceName(1, 2)).toBeNull()
  })

  it('stays quiet when the caller aborted the lookup', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        controller.abort()
        return Promise.reject(new DOMException('aborted', 'AbortError'))
      })
    )
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    expect(await reverseGeocodePlaceName(1, 2, controller.signal)).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })
})
