// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { useCreateTeam, useUpdateTeam, useUploadTeamAvatar } from './index'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useCreateTeam', () => {
  // The backend's shared Group JSON reader requires `id` and `groupType` to
  // be present in the request body (even though it discards both), so
  // omitting them makes this endpoint 400. See the comment on useCreateTeam.
  it('sends placeholder id and groupType fields required by the backend', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ id: 5, name: 'New Team' })))

    const { result } = renderHook(() => useCreateTeam(), { wrapper: queryClientWrapper() })
    result.current.mutate({ name: 'New Team' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const body = JSON.parse(await request.clone().text())
    expect(body).toEqual({ id: 0, groupType: 0, name: 'New Team' })
  })
})

describe('useUpdateTeam', () => {
  it('sends placeholder id and groupType fields required by the backend', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ id: 3, name: 'Updated Team' })))

    const { result } = renderHook(() => useUpdateTeam(), { wrapper: queryClientWrapper() })
    result.current.mutate({ teamId: 3, payload: { name: 'Updated Team' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const body = JSON.parse(await request.clone().text())
    expect(body).toEqual({ id: 3, groupType: 0, name: 'Updated Team' })
  })
})

describe('useUploadTeamAvatar', () => {
  it('posts the image as multipart form data and refreshes the team and its members', async () => {
    const updated = { id: 3, name: 'Team', avatarURL: '/api/v2/team/3/avatar/file' }
    const fetchMock = stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUploadTeamAvatar(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate({
      teamId: 3,
      imageFile: new File(['bytes'], 'logo.png', { type: 'image/png' }),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(updated)

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(request.url).toContain('api/v2/team/3/avatar')
    // ky must not overwrite the multipart boundary the FormData body sets.
    expect(request.headers.get('content-type')).toContain('multipart/form-data')
    const body = await request.clone().formData()
    expect((body.get('image') as File).name).toBe('logo.png')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team', 3] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user'] })
  })
})
