import ky from 'ky'

export const apiKey = window.env.VITE_SERVER_API_KEY
export const apiBaseUrl = window.env.VITE_API_BASE_URL || 'http://127.0.0.1:9000'

let unauthorizedHandler: (() => void) | undefined

/** Set a function to be called whenever an API request is rejected with HTTP 401. */
export const setUnauthorizedHandler = (handler: (() => void) | undefined) => {
  unauthorizedHandler = handler
}

export const apiRequest = ky.extend({
  prefixUrl: apiBaseUrl,
  credentials: 'include',
  timeout: 60000,
  retry: {
    limit: 0,
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Don't clobber Content-Type already set by ky (for json bodies) or by
        // the Request constructor (for FormData/URLSearchParams, which carries
        // the multipart boundary). Overwriting either breaks the body.
        if (!request.headers.has('content-type')) {
          request.headers.set('Content-Type', 'application/json')
        }
        if (apiKey) {
          request.headers.set('apiKey', apiKey)
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) unauthorizedHandler?.()
      },
    ],
  },
})

export const convertParamsToSearchParams = (
  params: Record<
    string,
    | string
    | number
    | boolean
    | Record<string, string | number | boolean>
    | Array<string | number | boolean>
    | null
    | undefined
  >
): Record<string, string | number | boolean> => {
  const searchParams: Record<string, string | number | boolean> = {}

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }

    if (typeof value === 'string') {
      searchParams[key] = value
    } else if (typeof value === 'number') {
      searchParams[key] = value
    } else if (typeof value === 'boolean') {
      searchParams[key] = value
    } else if (Array.isArray(value)) {
      searchParams[key] = value.map((item) => item.toString()).join(',')
    } else if (typeof value === 'object') {
      searchParams[key] = JSON.stringify(value)
    }
  })

  return searchParams
}
