// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { search } from './search'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('search.searchById', () => {
  it('is disabled when id is not greater than 0', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => search.searchById({ id: 0 }), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches search-by-id results when id is greater than 0', async () => {
    const response = {
      project: { id: 1, name: 'Project A' },
      challenge: null,
      task: null,
    }
    const fetchMock = stubFetch(new Response(JSON.stringify(response), { status: 200 }))

    const { result } = renderHook(() => search.searchById({ id: 1 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(response)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('id=1')
  })

  it('uses previous data as a placeholder while refetching with a new id', async () => {
    const responses = [
      new Response(
        JSON.stringify({ project: { id: 1, name: 'Project A' }, challenge: null, task: null }),
        { status: 200 }
      ),
      new Response(
        JSON.stringify({ project: { id: 2, name: 'Project B' }, challenge: null, task: null }),
        { status: 200 }
      ),
    ]
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_request: Request) => responses[call++])
    )

    const { result, rerender } = renderHook((id: number) => search.searchById({ id }), {
      wrapper: queryClientWrapper(),
      initialProps: 1,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.project?.id).toBe(1)

    rerender(2)
    await waitFor(() => expect(result.current.data?.project?.id).toBe(2))
  })
})
