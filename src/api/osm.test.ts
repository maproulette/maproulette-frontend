import { Window } from 'happy-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { fetchOSMElement, osmUserProfileURL } from './osm'

// osm.ts relies on the browser's DOMParser for the XML-based endpoints. The
// `unit` vitest project runs in a plain Node environment (no DOM), so we
// install happy-dom's DOMParser implementation as a global for this file only.
beforeAll(() => {
  const happyDomWindow = new Window()
  vi.stubGlobal('DOMParser', happyDomWindow.DOMParser)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal('DOMParser', new Window().DOMParser)
})

const OSM_SERVER = window.env.VITE_OSM_SERVER || 'https://www.openstreetmap.org'
const OSM_API_SERVER = window.env.VITE_OSM_API_SERVER || 'https://api.openstreetmap.org'

function stubFetch(implementation: (uri: string) => Promise<Response> | Response) {
  const fetchMock = vi.fn(async (uri: string) => implementation(uri))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('osm', () => {
  describe('osmUserProfileURL', () => {
    it('builds a profile URL for a simple username', () => {
      expect(osmUserProfileURL('someuser')).toBe(`${OSM_SERVER}/user/someuser`)
    })

    it('URL-encodes special characters in the username', () => {
      expect(osmUserProfileURL('john doe/weird')).toBe(
        `${OSM_SERVER}/user/${encodeURIComponent('john doe/weird')}`
      )
    })
  })

  describe('fetchOSMElement', () => {
    const xml =
      '<osm><node id="123" lat="1.5" visible="true"><tag k="highway" v="residential"/><tag k="oneway" v="yes"/></node></osm>'

    it('returns a normalized JSON element by default', async () => {
      stubFetch(() => new Response(xml, { status: 200 }))

      const element = await fetchOSMElement('node/123')

      expect(element).toEqual({
        id: 123,
        lat: 1.5,
        visible: true,
        tag: [
          { k: 'highway', v: 'residential' },
          { k: 'oneway', v: 'yes' },
        ],
      })
    })

    it('pushes a third+ same-named child onto an already-normalized array', async () => {
      const threeTagsXml =
        '<osm><node id="123"><tag k="highway" v="residential"/><tag k="oneway" v="yes"/><tag k="lanes" v="2"/></node></osm>'
      stubFetch(() => new Response(threeTagsXml, { status: 200 }))

      const element = await fetchOSMElement('node/123')

      expect(element).toEqual({
        id: 123,
        tag: [
          { k: 'highway', v: 'residential' },
          { k: 'oneway', v: 'yes' },
          { k: 'lanes', v: 2 },
        ],
      })
    })

    it('returns the raw XML Document when asXML is true', async () => {
      stubFetch(() => new Response(xml, { status: 200 }))

      const doc = await fetchOSMElement('node/123', true)

      expect(doc).not.toBeNull()
      expect((doc as Document).querySelector('node')?.getAttribute('id')).toBe('123')
    })

    it('returns null when the requested element type is not present in the response', async () => {
      stubFetch(() => new Response('<osm></osm>', { status: 200 }))

      const element = await fetchOSMElement('way/999')

      expect(element).toBeNull()
    })

    it('fetches from the correct URI using the type/id path', async () => {
      const fetchMock = stubFetch(() => new Response(xml, { status: 200 }))

      await fetchOSMElement('node/123')

      expect(fetchMock).toHaveBeenCalledWith(`${OSM_API_SERVER}/api/0.6/node/123`)
    })

    it.each([
      ['throws a mapped error message for a 404 response', 404, undefined, 'Element not found'],
      [
        'throws a mapped error message for a 410 response',
        410,
        undefined,
        'Element has been deleted',
      ],
      [
        'throws a generic message for an unmapped error status',
        500,
        'Internal Server Error',
        'OSM API error: Internal Server Error',
      ],
    ] as const)('%s', async (_label, status, statusText, expected) => {
      stubFetch(() => new Response('', { status, statusText }))

      await expect(fetchOSMElement('node/123')).rejects.toThrow(expected)
    })
  })
})
