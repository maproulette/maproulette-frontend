import { Window } from 'happy-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { osm } from './osm'

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
  describe('getOSMServerUrl / getOSMApiServerUrl', () => {
    it('returns the configured (default) OSM server URLs', () => {
      expect(osm.getOSMServerUrl()).toBe(OSM_SERVER)
      expect(osm.getOSMApiServerUrl()).toBe(OSM_API_SERVER)
    })
  })

  describe('osmUserProfileURL', () => {
    it('builds a profile URL for a simple username', () => {
      expect(osm.osmUserProfileURL('someuser')).toBe(`${OSM_SERVER}/user/someuser`)
    })

    it('URL-encodes special characters in the username', () => {
      expect(osm.osmUserProfileURL('john doe/weird')).toBe(
        `${OSM_SERVER}/user/${encodeURIComponent('john doe/weird')}`
      )
    })
  })

  describe('validateBBoxArea', () => {
    it('accepts a small, valid bounding box', () => {
      expect(osm.validateBBoxArea('-0.1,-0.1,0.1,0.1')).toEqual({ isValid: true })
    })

    it.each([
      ['with non-numeric components', 'a,b,c,d'],
      ['missing its 4th component', '1,2,3'],
      ['with extra components', '1,2,3,4,5'],
    ] as const)('rejects a bounding box %s', (_label, bbox) => {
      expect(osm.validateBBoxArea(bbox)).toEqual({
        isValid: false,
        error: 'Invalid bounding box format',
      })
    })

    it('rejects a bounding box whose area exceeds the maximum allowed', () => {
      const result = osm.validateBBoxArea('0,0,1,1')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('too large')
      expect(result.error).toContain('Maximum area: 0.25 square degrees')
      expect(result.error).toContain('Current area: 1.0000 square degrees')
    })
  })

  describe('fetchOSMData', () => {
    it('throws without fetching when the bounding box is invalid', async () => {
      const fetchMock = stubFetch(() => new Response('', { status: 200 }))

      await expect(osm.fetchOSMData('a,b,c,d')).rejects.toThrow('Invalid bounding box format')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('throws without fetching when the bounding box area is too large', async () => {
      const fetchMock = stubFetch(() => new Response('', { status: 200 }))

      await expect(osm.fetchOSMData('0,0,1,1')).rejects.toThrow(/too large/)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fetches and parses the map XML for a valid bounding box', async () => {
      const xml = '<osm><node id="1" lat="1.5" lon="2.5"/></osm>'
      const fetchMock = stubFetch(() => new Response(xml, { status: 200 }))

      const doc = await osm.fetchOSMData('-0.1,-0.1,0.1,0.1')

      expect(fetchMock).toHaveBeenCalledWith(`${OSM_API_SERVER}/api/0.6/map?bbox=-0.1,-0.1,0.1,0.1`)
      expect(doc.querySelector('node')?.getAttribute('id')).toBe('1')
    })

    it('throws a mapped error message when the fetch fails', async () => {
      stubFetch(() => new Response('', { status: 400 }))

      await expect(osm.fetchOSMData('-0.1,-0.1,0.1,0.1')).rejects.toThrow(
        'Request too large - please zoom in further'
      )
    })

    it('falls back to a generic message if validation fails without an error string', async () => {
      // validateBBoxArea always sets an error string alongside isValid: false, but
      // fetchOSMData defensively falls back to a generic message in case it doesn't.
      const fetchMock = stubFetch(() => new Response('', { status: 200 }))
      const validateSpy = vi.spyOn(osm, 'validateBBoxArea').mockReturnValueOnce({ isValid: false })

      try {
        await expect(osm.fetchOSMData('-0.1,-0.1,0.1,0.1')).rejects.toThrow('Invalid bounding box')
        expect(fetchMock).not.toHaveBeenCalled()
      } finally {
        validateSpy.mockRestore()
      }
    })
  })

  describe('fetchOSMElement', () => {
    const xml =
      '<osm><node id="123" lat="1.5" visible="true"><tag k="highway" v="residential"/><tag k="oneway" v="yes"/></node></osm>'

    it('returns a normalized JSON element by default', async () => {
      stubFetch(() => new Response(xml, { status: 200 }))

      const element = await osm.fetchOSMElement('node/123')

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

      const element = await osm.fetchOSMElement('node/123')

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

      const doc = await osm.fetchOSMElement('node/123', true)

      expect(doc).not.toBeNull()
      expect((doc as Document).querySelector('node')?.getAttribute('id')).toBe('123')
    })

    it('returns null when the requested element type is not present in the response', async () => {
      stubFetch(() => new Response('<osm></osm>', { status: 200 }))

      const element = await osm.fetchOSMElement('way/999')

      expect(element).toBeNull()
    })

    it('fetches from the correct URI using the type/id path', async () => {
      const fetchMock = stubFetch(() => new Response(xml, { status: 200 }))

      await osm.fetchOSMElement('node/123')

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

      await expect(osm.fetchOSMElement('node/123')).rejects.toThrow(expected)
    })
  })

  describe('fetchOSMElementHistory', () => {
    it('returns null without fetching when idString is empty', async () => {
      const fetchMock = stubFetch(() => new Response('{}', { status: 200 }))

      const result = await osm.fetchOSMElementHistory('')

      expect(result).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fetches history JSON from the correct URI', async () => {
      const fetchMock = stubFetch(
        () => new Response(JSON.stringify({ elements: [] }), { status: 200 })
      )

      await osm.fetchOSMElementHistory('way/55')

      expect(fetchMock).toHaveBeenCalledWith(`${OSM_API_SERVER}/api/0.6/way/55/history.json`)
    })

    it('returns the raw elements when includeChangesets is false', async () => {
      const elements = [
        { type: 'way', id: 55, version: 1, changeset: 10, timestamp: 't', user: 'u', uid: 1 },
      ]
      stubFetch(() => new Response(JSON.stringify({ elements }), { status: 200 }))

      const result = await osm.fetchOSMElementHistory('way/55', false)

      expect(result).toEqual(elements)
    })

    it('defaults to an empty array when the response has no elements', async () => {
      stubFetch(() => new Response(JSON.stringify({}), { status: 200 }))

      const result = await osm.fetchOSMElementHistory('way/55')

      expect(result).toEqual([])
    })

    it('merges full changeset data into each history entry when includeChangesets is true', async () => {
      const elements = [
        { type: 'way', id: 55, version: 1, changeset: 10, timestamp: 't1', user: 'u', uid: 1 },
        { type: 'way', id: 55, version: 2, changeset: 10, timestamp: 't2', user: 'u', uid: 1 },
        { type: 'way', id: 55, version: 3, changeset: 20, timestamp: 't3', user: 'u', uid: 1 },
      ]

      const fetchMock = vi.fn(async (uri: string) => {
        if (uri.endsWith('history.json')) {
          return new Response(JSON.stringify({ elements }), { status: 200 })
        }
        // fetchOSMChangesets uses fetchXMLData -> fetch + DOMParser
        expect(uri).toBe(`${OSM_API_SERVER}/api/0.6/changesets?changesets=10,20`)
        const xml =
          '<osm><changeset id="10" user="alice" open="false"/><changeset id="20" user="bob" open="true"/></osm>'
        return new Response(xml, { status: 200 })
      })
      vi.stubGlobal('fetch', fetchMock)

      const result = await osm.fetchOSMElementHistory('way/55', true)

      expect(result).toEqual([
        {
          ...elements[0],
          changeset: { id: 10, user: 'alice', open: false },
        },
        {
          ...elements[1],
          changeset: { id: 10, user: 'alice', open: false },
        },
        {
          ...elements[2],
          changeset: { id: 20, user: 'bob', open: true },
        },
      ])
    })

    it('leaves entries alone when their changeset is falsy or has no matching fetched changeset', async () => {
      const elements = [
        { type: 'way', id: 1, version: 1, changeset: 10, timestamp: 't1', user: 'u', uid: 1 },
        { type: 'way', id: 2, version: 1, changeset: 0, timestamp: 't2', user: 'u', uid: 1 },
        { type: 'way', id: 3, version: 1, changeset: 20, timestamp: 't3', user: 'u', uid: 1 },
      ]

      const fetchMock = vi.fn(async (uri: string) => {
        if (uri.endsWith('history.json')) {
          return new Response(JSON.stringify({ elements }), { status: 200 })
        }
        // Simulate the OSM API only returning some of the requested changesets
        // (e.g. changeset 20 was deleted/hidden), so changeset 20 has no match.
        expect(uri).toBe(`${OSM_API_SERVER}/api/0.6/changesets?changesets=10,20`)
        const xml = '<osm><changeset id="10" user="alice" open="false"/></osm>'
        return new Response(xml, { status: 200 })
      })
      vi.stubGlobal('fetch', fetchMock)

      const result = await osm.fetchOSMElementHistory('way/1', true)

      expect(result).toEqual([
        { ...elements[0], changeset: { id: 10, user: 'alice', open: false } },
        elements[1],
        elements[2],
      ])
    })

    it('throws a mapped error message when the history fetch fails', async () => {
      stubFetch(() => new Response('', { status: 509 }))

      await expect(osm.fetchOSMElementHistory('way/55')).rejects.toThrow(
        'Bandwidth limit exceeded - please try again later'
      )
    })
  })

  describe('fetchOSMChangesets', () => {
    it('returns an empty array without fetching when given no changeset ids', async () => {
      const fetchMock = stubFetch(() => new Response('<osm></osm>', { status: 200 }))

      const result = await osm.fetchOSMChangesets([])

      expect(result).toEqual([])
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fetches and normalizes multiple changesets', async () => {
      const xml =
        '<osm><changeset id="1" user="alice" open="false"/><changeset id="2" user="bob" open="true"/></osm>'
      const fetchMock = stubFetch(() => new Response(xml, { status: 200 }))

      const result = await osm.fetchOSMChangesets([1, 2])

      expect(fetchMock).toHaveBeenCalledWith(`${OSM_API_SERVER}/api/0.6/changesets?changesets=1,2`)
      expect(result).toEqual([
        { id: 1, user: 'alice', open: false },
        { id: 2, user: 'bob', open: true },
      ])
    })
  })

  describe('fetchOSMUser', () => {
    it('returns the display name parsed out of the XML response', async () => {
      stubFetch(
        () =>
          new Response('<osm><user id="7" display_name="alice" account_created="x"/></osm>', {
            status: 200,
          })
      )

      const result = await osm.fetchOSMUser(7)

      expect(result).toEqual({ id: 7, displayName: 'alice' })
    })

    it('returns a null display name when it cannot be parsed from a successful response', async () => {
      stubFetch(() => new Response('<osm><user id="7"/></osm>', { status: 200 }))

      const result = await osm.fetchOSMUser(7)

      expect(result).toEqual({ id: 7, displayName: null })
    })

    it('returns a null display name (not an error) for a 404 response', async () => {
      stubFetch(() => new Response('', { status: 404 }))

      const result = await osm.fetchOSMUser(999)

      expect(result).toEqual({ id: 999, displayName: null })
    })

    it('throws a mapped error message for other failure statuses', async () => {
      stubFetch(() => new Response('', { status: 509 }))

      await expect(osm.fetchOSMUser(7)).rejects.toThrow(
        'Bandwidth limit exceeded - please try again later'
      )
    })

    it('fetches from the correct user URI', async () => {
      const fetchMock = stubFetch(() => new Response('<osm><user id="7"/></osm>', { status: 200 }))

      await osm.fetchOSMUser(7)

      expect(fetchMock).toHaveBeenCalledWith(`${OSM_API_SERVER}/api/0.6/user/7`)
    })
  })

  describe('getBBoxString', () => {
    it('builds a "minLon,minLat,maxLon,maxLat" string from map bounds', () => {
      const bounds = {
        getWest: () => -1.5,
        getSouth: () => 2.25,
        getEast: () => 1.5,
        getNorth: () => 3.75,
      }

      expect(osm.getBBoxString(bounds)).toBe('-1.5,2.25,1.5,3.75')
    })
  })
})
