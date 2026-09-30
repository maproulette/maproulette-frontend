import ky from 'ky'

export const apiKey = window.env.VITE_SERVER_API_KEY

export const apiRequest = ky.extend({
  prefix: window.env.VITE_API_BASE_URL || 'http://127.0.0.1:9000',
  credentials: 'include',
  timeout: 60000,
  retry: {
    limit: 0,
  },
  parseJson: (text) => (text === '' ? undefined : JSON.parse(text)),
  hooks: {
    beforeRequest: [
      ({ request }) => {
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
