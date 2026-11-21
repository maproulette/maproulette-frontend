// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengeComments } from './comments'

afterEach(() => {
  vi.unstubAllGlobals()
})

const sampleComment = {
  id: 1,
  osm_id: 2,
  osm_username: 'alice',
  avatarUrl: 'https://example.com/a.png',
  challengeId: 3,
  projectId: 4,
  created: 12345,
  comment: 'nice work',
}

describe('challengeComments.getChallengeComments', () => {
  it('fetches comments for a challenge id', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([sampleComment]), { status: 200 }))

    const { result } = renderHook(() => challengeComments.getChallengeComments(3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([sampleComment])
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/3/challengeComments')
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => challengeComments.getChallengeComments(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeComments.getTaskComments', () => {
  it('asks for every comment rather than the default first page', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => challengeComments.getTaskComments(3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).searchParams.get('limit')).toBe('-1')
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => challengeComments.getTaskComments(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeComments.useAddChallengeComment', () => {
  it('posts a new comment and invalidates the related comment queries', async () => {
    const created = { id: 9, comment: 'great', created: 5555 }
    stubFetch(new Response(JSON.stringify(created), { status: 200 }))
    const client = createTestQueryClient()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => challengeComments.useAddChallengeComment(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate({ challengeId: 3, comment: 'great' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(created)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'comments', 3] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'taskComments', 3] })
  })
})
