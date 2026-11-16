import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetch } from '@/test/stubFetch'
import { apiKey, apiRequest, convertParamsToSearchParams } from './index'

describe('convertParamsToSearchParams', () => {
  it('passes through string values unchanged', () => {
    expect(convertParamsToSearchParams({ name: 'hello' })).toEqual({ name: 'hello' })
  })

  it('passes through number values unchanged', () => {
    expect(convertParamsToSearchParams({ limit: 10 })).toEqual({ limit: 10 })
  })

  it('passes through zero as a number, not omitted', () => {
    expect(convertParamsToSearchParams({ page: 0 })).toEqual({ page: 0 })
  })

  it('passes through boolean values unchanged, including false', () => {
    expect(convertParamsToSearchParams({ onlyEnabled: true, onlyOwned: false })).toEqual({
      onlyEnabled: true,
      onlyOwned: false,
    })
  })

  it('joins array values into a comma-separated string', () => {
    expect(convertParamsToSearchParams({ ids: [1, 2, 3] })).toEqual({ ids: '1,2,3' })
  })

  it('joins arrays of mixed string/number/boolean items via toString', () => {
    expect(convertParamsToSearchParams({ mixed: ['a', 2, false] })).toEqual({ mixed: 'a,2,false' })
  })

  it('joins an empty array into an empty string', () => {
    expect(convertParamsToSearchParams({ empty: [] })).toEqual({ empty: '' })
  })

  it('JSON-stringifies plain object values', () => {
    expect(convertParamsToSearchParams({ filter: { status: 'open' } })).toEqual({
      filter: JSON.stringify({ status: 'open' }),
    })
  })

  it('omits keys whose value is null', () => {
    expect(convertParamsToSearchParams({ search: null })).toEqual({})
  })

  it('omits keys whose value is undefined', () => {
    expect(convertParamsToSearchParams({ search: undefined })).toEqual({})
  })

  it('handles a mix of types in a single call, omitting only null/undefined', () => {
    const result = convertParamsToSearchParams({
      name: 'hello',
      limit: 5,
      onlyEnabled: true,
      ids: [1, 2],
      filter: { a: 1 },
      skipMe: null,
      alsoSkip: undefined,
    })

    expect(result).toEqual({
      name: 'hello',
      limit: 5,
      onlyEnabled: true,
      ids: '1,2',
      filter: JSON.stringify({ a: 1 }),
    })
  })

  it('returns an empty object when given an empty input', () => {
    expect(convertParamsToSearchParams({})).toEqual({})
  })

  it('omits a key whose value matches none of the supported types', () => {
    // The parameter type only allows string/number/boolean/object/array/null/undefined,
    // but nothing stops a caller from passing something else at runtime (e.g. a
    // function). Cast narrowly instead of widening with `as any` to exercise that
    // fallthrough path, where the key is silently left unset.
    const params = { cb: () => {} } as unknown as Parameters<typeof convertParamsToSearchParams>[0]

    expect(convertParamsToSearchParams(params)).toEqual({})
  })
})

describe('apiKey', () => {
  it('is read from window.env.VITE_SERVER_API_KEY', () => {
    expect(apiKey).toBe(window.env.VITE_SERVER_API_KEY)
  })
})

// window.env's fields are declared read-only (they're meant to be set once at
// app boot from env.json), but this test needs to simulate a deployment with
// no configured API key, so it writes through a narrow mutable view instead
// of widening with `as any`.
type MutableEnv = { VITE_SERVER_API_KEY?: string; VITE_API_BASE_URL?: string }

describe('apiRequest beforeRequest hook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets a default Content-Type of application/json', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

    await apiRequest.get('some/path').json()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [request] = fetchMock.mock.calls[0]
    expect(request.headers.get('content-type')).toBe('application/json')
  })

  it('sets the apiKey header when an API key is configured', async () => {
    const mutableEnv = window.env as MutableEnv
    const originalKey = mutableEnv.VITE_SERVER_API_KEY
    mutableEnv.VITE_SERVER_API_KEY = 'configured-key'
    vi.resetModules()

    try {
      const { apiRequest: freshApiRequest } = await import('./index')
      const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

      await freshApiRequest.get('some/path').json()

      const [request] = fetchMock.mock.calls[0]
      expect(request.headers.get('apikey')).toBe('configured-key')
    } finally {
      mutableEnv.VITE_SERVER_API_KEY = originalKey
      vi.resetModules()
    }
  })

  it('does not overwrite a content-type header already set on the request', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))

    await apiRequest.post('upload', { headers: { 'content-type': 'text/plain' } })

    const [request] = fetchMock.mock.calls[0]
    expect(request.headers.get('content-type')).toBe('text/plain')
  })

  it('omits the apiKey header when no API key is configured', async () => {
    const mutableEnv = window.env as MutableEnv
    const originalKey = mutableEnv.VITE_SERVER_API_KEY
    mutableEnv.VITE_SERVER_API_KEY = undefined
    vi.resetModules()

    try {
      const { apiRequest: freshApiRequest } = await import('./index')
      const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

      await freshApiRequest.get('some/path').json()

      const [request] = fetchMock.mock.calls[0]
      expect(request.headers.has('apikey')).toBe(false)
    } finally {
      mutableEnv.VITE_SERVER_API_KEY = originalKey
      vi.resetModules()
    }
  })

  it('falls back to the default local server URL when no API base URL is configured', async () => {
    const mutableEnv = window.env as MutableEnv
    const originalBaseUrl = mutableEnv.VITE_API_BASE_URL
    mutableEnv.VITE_API_BASE_URL = undefined
    vi.resetModules()

    try {
      const { apiRequest: freshApiRequest } = await import('./index')
      const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

      await freshApiRequest.get('some/path').json()

      const [request] = fetchMock.mock.calls[0]
      expect(request.url).toBe('http://127.0.0.1:9000/some/path')
    } finally {
      mutableEnv.VITE_API_BASE_URL = originalBaseUrl
      vi.resetModules()
    }
  })
})
