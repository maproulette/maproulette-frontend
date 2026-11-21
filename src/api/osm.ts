/**
 * OSM API functions for fetching OpenStreetMap data
 */
import { queryOptions } from '@tanstack/react-query'

const OSM_SERVER = window.env.VITE_OSM_SERVER || 'https://www.openstreetmap.org'
const OSM_API_SERVER = window.env.VITE_OSM_API_SERVER || 'https://api.openstreetmap.org'

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
   * Generates a URL to the given user's OSM profile page
   */
  osmUserProfileURL: (osmUsername: string): string => {
    return `${OSM_SERVER}/user/${encodeURIComponent(osmUsername)}`
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
}
