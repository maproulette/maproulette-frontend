// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { userAnnouncements } from './announcements'

afterEach(() => {
  vi.unstubAllGlobals()
})

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('userAnnouncements.announcements', () => {
  it('parses the notices the backend serves', async () => {
    const notice = {
      uuid: 'outage-1',
      message: 'Planned downtime',
      expirationTimestamp: '2099-01-01T00:00:00Z',
    }
    const fetchMock = stubFetch(jsonResponse({ message: { notices: [notice] } }))

    const { result } = renderHook(() => userAnnouncements.announcements(), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([notice])
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toBe('/api/v2/user/announcements')
  })

  it('reports no notices when the deployment has none configured', async () => {
    stubFetch(new Response('', { status: 404 }))

    const { result } = renderHook(() => userAnnouncements.announcements(), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
