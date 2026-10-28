// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { Project } from '@/types/Project'
import { useProjectChallengeCounts } from './useProjectChallengeCounts'

afterEach(() => {
  vi.unstubAllGlobals()
})

const projects = [{ id: 1 }, { id: 2 }] as Project[]

describe('useProjectChallengeCounts', () => {
  it('fetches the listing for the given projects', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    renderHook(() => useProjectChallengeCounts(projects), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('projectIds=1%2C2')
  })

  it('does not fetch when disabled', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    renderHook(() => useProjectChallengeCounts(projects, { enabled: false }), {
      wrapper: queryClientWrapper(),
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
