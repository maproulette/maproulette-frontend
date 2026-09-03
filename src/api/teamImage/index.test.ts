// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { TeamImage as TeamImageType } from '@/types/TeamImage'
import { teamImage } from './index'

afterEach(() => {
  vi.unstubAllGlobals()
})

const anImage = (overrides: Partial<TeamImageType> = {}): TeamImageType => ({
  id: 5,
  teamId: 2,
  teamName: 'Best Team',
  name: 'logo.png',
  contentType: 'image/png',
  size: 1024,
  status: 1,
  statusName: 'approved',
  requestedBy: 9,
  requestedByName: 'Someone',
  reviewedBy: null,
  reviewedByName: null,
  reviewedAt: null,
  reviewComment: null,
  created: '2026-08-31T00:00:00Z',
  modified: '2026-08-31T00:00:00Z',
  url: '/api/v2/teamImage/5/file',
  ...overrides,
})

describe('teamImage.available', () => {
  it('fetches the approved images across the user’s teams', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([anImage()]), { status: 200 }))

    const { result } = renderHook(() => teamImage.available(), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('GET')
    expect(new URL(request.url).pathname).toContain('/api/v2/teamImages/available')
    expect(result.current.data).toEqual([anImage()])
  })

  it('does not fetch when disabled', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    renderHook(() => teamImage.available(false), { wrapper: queryClientWrapper() })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('teamImage.forTeam', () => {
  it('fetches a single team’s images', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([anImage()]), { status: 200 }))

    const { result } = renderHook(() => teamImage.forTeam(2), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toContain('/api/v2/team/2/images')
  })

  it('does not fetch without a team id', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    renderHook(() => teamImage.forTeam(undefined), { wrapper: queryClientWrapper() })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('teamImage.pending', () => {
  it('fetches the review queue', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => teamImage.pending(), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toContain('/api/v2/teamImages/pending')
  })
})

describe('teamImage.useRequestImage', () => {
  it('posts the file as multipart form data and refreshes the image lists', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify(anImage({ status: 0, statusName: 'pending' })), { status: 200 })
    )
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => teamImage.useRequestImage(), {
      wrapper: queryClientWrapper(queryClient),
    })

    const file = new File(['png-bytes'], 'logo.png', { type: 'image/png' })
    result.current.mutate({ teamId: 2, imageFile: file, name: 'Our logo' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(new URL(request.url).pathname).toContain('/api/v2/team/2/image')

    const formData = await request.clone().formData()
    expect((formData.get('image') as File).name).toBe('logo.png')
    expect(formData.get('name')).toBe('Our logo')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teamImage'] })
  })

  it('omits the name part when none was given', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(anImage()), { status: 200 }))

    const { result } = renderHook(() => teamImage.useRequestImage(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({
      teamId: 2,
      imageFile: new File(['b'], 'logo.png', { type: 'image/png' }),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const formData = await fetchMock.mock.calls[0][0].clone().formData()
    expect(formData.has('name')).toBe(false)
  })
})

describe('teamImage.useApproveImage', () => {
  it('approves without a comment', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(anImage()), { status: 200 }))

    const { result } = renderHook(() => teamImage.useApproveImage(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ imageId: 5 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    const url = new URL(request.url)
    expect(url.pathname).toContain('/api/v2/teamImage/5/approve')
    expect(url.searchParams.has('comment')).toBe(false)
  })

  it('passes a comment through as a query param', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(anImage()), { status: 200 }))

    const { result } = renderHook(() => teamImage.useApproveImage(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ imageId: 5, comment: 'looks good' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(fetchMock.mock.calls[0][0].url).searchParams.get('comment')).toBe('looks good')
  })
})

describe('teamImage.useRejectImage', () => {
  it('rejects and also refreshes challenges, since rejection detaches the image', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify(anImage({ status: 2 })), { status: 200 })
    )
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => teamImage.useRejectImage(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ imageId: 5, comment: 'off brand' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const url = new URL(fetchMock.mock.calls[0][0].url)
    expect(url.pathname).toContain('/api/v2/teamImage/5/reject')
    expect(url.searchParams.get('comment')).toBe('off brand')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teamImage'] })
  })

  it('sends no comment param when the moderator gave no reason', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify(anImage({ status: 2 })), { status: 200 })
    )

    const { result } = renderHook(() => teamImage.useRejectImage(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ imageId: 5 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(fetchMock.mock.calls[0][0].url).search).toBe('')
  })
})

describe('teamImage.useDeleteImage', () => {
  it('deletes and refreshes both challenges and image lists', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => teamImage.useDeleteImage(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(5)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(new URL(request.url).pathname).toContain('/api/v2/teamImage/5')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teamImage'] })
  })
})
