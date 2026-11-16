// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { serviceApi } from './info'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('serviceApi.info', () => {
  it('fetches service info', async () => {
    const info = { version: '1.2.3', buildNumber: '456' }
    const fetchMock = stubFetch(new Response(JSON.stringify(info), { status: 200 }))

    const { result } = renderHook(() => serviceApi.info(), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(info)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/service/info')
  })

  it('surfaces an error when the request fails', async () => {
    stubFetch(new Response('', { status: 500 }))

    const { result } = renderHook(() => serviceApi.info(), { wrapper: queryClientWrapper() })

    // serviceApi.info sets retry: 1 on the query itself, which overrides the
    // test QueryClient's retry: false default, so the failure surfaces only
    // after one retry (with its default backoff delay) — allow extra time.
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })
  })
})
