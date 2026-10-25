import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetch } from '@/test/stubFetch'
import { nominatim } from './nominatim'

afterEach(() => {
  vi.unstubAllGlobals()
})

const NOMINATIM_BASE_URL =
  window.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org'

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

const requestedUrl = (fetchMock: ReturnType<typeof stubFetch>) =>
  new URL(fetchMock.mock.calls[0][0] as unknown as string)

describe('nominatim', () => {
  it('searches the configured Nominatim server', async () => {
    const fetchMock = stubFetch(jsonResponse([{ display_name: 'Bonn', place_id: '1' }]))

    expect(await nominatim.search('Bonn & Köln')).toEqual([{ display_name: 'Bonn', place_id: '1' }])

    const url = requestedUrl(fetchMock)
    expect(`${url.origin}${url.pathname}`).toBe(`${NOMINATIM_BASE_URL}/search`)
    expect(url.searchParams.get('q')).toBe('Bonn & Köln')
    expect(url.searchParams.get('format')).toBe('json')
  })

  it('does not try to set a User-Agent header', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await nominatim.search('Bonn')

    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('User-Agent')).toBe(false)
  })

  it('looks up a single place by its type-prefixed OSM id', async () => {
    const fetchMock = stubFetch(jsonResponse([{ display_name: 'Salt Lake City' }]))

    expect(await nominatim.lookup('R126461')).toEqual({ display_name: 'Salt Lake City' })

    const url = requestedUrl(fetchMock)
    expect(url.pathname).toBe('/lookup')
    expect(url.searchParams.get('osm_ids')).toBe('R126461')
    expect(url.searchParams.get('polygon_geojson')).toBe('1')
  })

  it('returns null when a lookup finds nothing', async () => {
    stubFetch(jsonResponse([]))

    expect(await nominatim.lookup('N1')).toBeNull()
  })

  it('throws when Nominatim responds with an error', async () => {
    stubFetch(new Response('slow down', { status: 429, statusText: 'Too Many Requests' }))

    await expect(nominatim.search('Bonn')).rejects.toThrow('429')
  })
})
