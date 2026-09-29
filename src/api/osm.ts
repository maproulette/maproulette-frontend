/**
 * OSM API functions for fetching OpenStreetMap data
 */
import { queryOptions } from '@tanstack/react-query'

const OSM_SERVER = window.env.VITE_OSM_SERVER || 'https://www.openstreetmap.org'
const OSM_API_SERVER = window.env.VITE_OSM_API_SERVER || 'https://api.openstreetmap.org'

/**
 * Maximum allowed area for OSM data requests (0.25 square degrees)
 * This matches the OSM API 0.6 map endpoint limit
 */
const MAX_OSM_AREA = 0.25

/**
 * OSM API error codes and their meanings
 */
const OSM_ERROR_MESSAGES: Record<number, string> = {
  400: 'Request too large - please zoom in further',
  404: 'Element not found',
  410: 'Element has been deleted',
  509: 'Bandwidth limit exceeded - please try again later',
}

/**
 * Handle OSM API errors
 */
const handleOSMError = (response: Response): never => {
  const message = OSM_ERROR_MESSAGES[response.status] || `OSM API error: ${response.statusText}`
  throw new Error(message)
}

/**
 * Fetch XML data from a URI and parse it
 */
const fetchXMLData = async (uri: string): Promise<Document> => {
  const response = await fetch(uri)
  if (!response.ok) {
    handleOSMError(response)
  }
  const rawXML = await response.text()
  return new DOMParser().parseFromString(rawXML, 'application/xml')
}

/**
 * Normalize XML attributes into a more usable format
 */
interface NormalizedElement {
  [key: string]: string | number | boolean | NormalizedElement | NormalizedElement[]
}

const normalizeXMLElement = (element: Element): NormalizedElement => {
  const result: NormalizedElement = {}

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]

    const numValue = Number(attr.value)
    if (!Number.isNaN(numValue) && attr.value.trim() !== '') {
      result[attr.name] = numValue
    } else if (attr.value === 'true') {
      result[attr.name] = true
    } else if (attr.value === 'false') {
      result[attr.name] = false
    } else {
      result[attr.name] = attr.value
    }
  }

  const children = element.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const tagName = child.tagName
    const normalizedChild = normalizeXMLElement(child)

    if (result[tagName]) {
      if (Array.isArray(result[tagName])) {
        ;(result[tagName] as NormalizedElement[]).push(normalizedChild)
      } else {
        result[tagName] = [result[tagName] as NormalizedElement, normalizedChild]
      }
    } else {
      result[tagName] = normalizedChild
    }
  }

  return result
}

export interface OSMHistoryElement {
  type: string
  id: number
  version: number
  visible?: boolean
  changeset: number | { id: number; [key: string]: unknown }
  timestamp: string
  user: string
  uid: number
  tags?: Record<string, string>
  [key: string]: unknown
}

export interface OSMChangeset {
  id: number
  created_at?: string
  closed_at?: string
  open?: boolean
  user?: string
  uid?: number
  comments_count?: number
  changes_count?: number
  [key: string]: unknown
}

export const osm = {
  /**
   * Shared query definition for one OSM element, so every caller hits the same
   * cache entry. `idString` is `<type>/<id>`, e.g. `way/12345`.
   */
  elementOptions: (idString: string | null) =>
    queryOptions({
      queryKey: ['osm', 'element', idString],
      queryFn: () => osm.fetchOSMElement(idString as string),
      enabled: !!idString,
      staleTime: 5 * 60 * 1000,
      retry: false,
    }),

  /**
   * Get the OSM server URL (for user-facing links)
   */
  getOSMServerUrl: (): string => OSM_SERVER,

  /**
   * Get the OSM API server URL (for API calls)
   */
  getOSMApiServerUrl: (): string => OSM_API_SERVER,

  /**
   * Generates a URL to the given user's OSM profile page
   */
  osmUserProfileURL: (osmUsername: string): string => {
    return `${OSM_SERVER}/user/${encodeURIComponent(osmUsername)}`
  },

  /**
   * Validate bounding box area against OSM API limits
   * @param bbox Bounding box string in format "minLon,minLat,maxLon,maxLat"
   * @returns Object with isValid boolean and error message if invalid
   */
  validateBBoxArea: (bbox: string): { isValid: boolean; error?: string } => {
    const parts = bbox.split(',')
    const [minLon, minLat, maxLon, maxLat] = parts.map(Number)

    if (
      parts.length !== 4 ||
      Number.isNaN(minLon) ||
      Number.isNaN(minLat) ||
      Number.isNaN(maxLon) ||
      Number.isNaN(maxLat)
    ) {
      return { isValid: false, error: 'Invalid bounding box format' }
    }

    const width = maxLon - minLon
    const height = maxLat - minLat
    const area = width * height

    if (area > MAX_OSM_AREA) {
      return {
        isValid: false,
        error: `The selected area is too large to load OSM data. Please zoom in further to view OSM features. Maximum area: ${MAX_OSM_AREA} square degrees. Current area: ${area.toFixed(4)} square degrees.`,
      }
    }

    return { isValid: true }
  },

  /**
   * Fetch OSM XML data for a bounding box
   * @param bbox Bounding box string in format "minLon,minLat,maxLon,maxLat"
   * @returns Promise resolving to parsed XML Document
   * @throws Error if bounding box area exceeds limits or fetch fails
   */
  fetchOSMData: async (bbox: string): Promise<Document> => {
    const validation = osm.validateBBoxArea(bbox)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid bounding box')
    }

    const uri = `${OSM_API_SERVER}/api/0.6/map?bbox=${bbox}`
    return fetchXMLData(uri)
  },

  /**
   * Retrieve the current OpenStreetMap data for the given element
   * @param idString Element identifier in format `<type>/<id>` (e.g. `way/12345`)
   * @param asXML If true, returns the parsed XML Document instead of JSON
   * @returns Promise resolving to element data (JSON by default, or XML Document if asXML is true)
   */
  fetchOSMElement: async (
    idString: string,
    asXML = false
  ): Promise<Document | NormalizedElement | null> => {
    const uri = `${OSM_API_SERVER}/api/0.6/${idString}`
    const xmlDoc = await fetchXMLData(uri)
    if (asXML) return xmlDoc

    const elementType = idString.split('/')[0]
    const element = xmlDoc.querySelector(elementType)
    if (!element) return null

    return normalizeXMLElement(element)
  },

  /**
   * Retrieve the history for the given OpenStreetMap element
   * @param idString Element identifier in format `<type>/<id>` (e.g. `way/12345`)
   * @param includeChangesets If true, fetches full changeset data for each history entry
   * @returns Promise resolving to array of history elements
   */
  fetchOSMElementHistory: async (
    idString: string,
    includeChangesets = false
  ): Promise<OSMHistoryElement[] | null> => {
    if (!idString) return null

    const uri = `${OSM_API_SERVER}/api/0.6/${idString}/history.json`
    const response = await fetch(uri)
    if (!response.ok) {
      handleOSMError(response)
    }

    const history = await response.json()
    const elements: OSMHistoryElement[] = history.elements || []

    if (includeChangesets && elements.length > 0) {
      const changesetIds = elements.map((e) => e.changeset as number).filter(Boolean)
      const uniqueChangesetIds = [...new Set(changesetIds)]
      const changesetMap = await osm.fetchOSMChangesets(uniqueChangesetIds)

      elements.forEach((entry) => {
        const changesetId = entry.changeset as number
        if (changesetId) {
          const changesetData = changesetMap.find((c) => c.id === changesetId)
          if (changesetData) {
            const { id: _, ...restChangesetData } = changesetData
            entry.changeset = {
              id: changesetId,
              ...restChangesetData,
            }
          }
        }
      })
    }

    return elements
  },

  /**
   * Retrieve the specified OpenStreetMap changesets
   * @param changesetIds Array of changeset IDs to fetch
   * @returns Promise resolving to array of changeset objects
   */
  fetchOSMChangesets: async (changesetIds: number[]): Promise<OSMChangeset[]> => {
    if (!changesetIds || changesetIds.length === 0) return []

    const uri = `${OSM_API_SERVER}/api/0.6/changesets?changesets=${changesetIds.join(',')}`
    const xmlDoc = await fetchXMLData(uri)

    const changesets: OSMChangeset[] = []
    const changesetElements = xmlDoc.querySelectorAll('changeset')

    changesetElements.forEach((element) => {
      const changeset = normalizeXMLElement(element) as OSMChangeset
      changesets.push(changeset)
    })

    return changesets
  },

  /**
   * Retrieve OpenStreetMap user data for the user with the given OSM user id
   * @param osmUserId The OSM user ID (not MapRoulette user ID)
   * @returns Promise resolving to user data object
   */
  fetchOSMUser: async (osmUserId: number): Promise<{ id: number; displayName: string | null }> => {
    const uri = `${OSM_API_SERVER}/api/0.6/user/${osmUserId}`
    const response = await fetch(uri)

    if (response.ok) {
      const xmlData = await response.text()
      const displayNameMatch = /display_name="([^"]+)"/.exec(xmlData)
      return { id: osmUserId, displayName: displayNameMatch?.[1] || null }
    }

    if (response.status === 404) {
      return { id: osmUserId, displayName: null }
    }

    return handleOSMError(response)
  },

  /**
   * Convert map bounds to OSM API bbox string
   * @param bounds MapLibre bounds object
   * @returns Bounding box string "minLon,minLat,maxLon,maxLat"
   */
  getBBoxString: (bounds: {
    getWest: () => number
    getSouth: () => number
    getEast: () => number
    getNorth: () => number
  }): string => {
    return `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
  },
}
