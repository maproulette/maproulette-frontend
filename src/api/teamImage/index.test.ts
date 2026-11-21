// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { TeamImage as TeamImageType } from '@/types/TeamImage'
import { useApproveTeamImage, useRejectTeamImage, useRequestTeamImage } from './index'

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
  // Epoch millis, as the backend writes its timestamps.
  created: 1788134400000,
  modified: 1788134400000,
  url: '/api/v2/teamImage/5/file',
  ...overrides,
})

describe('useRequestTeamImage', () => {
  it('posts the file as multipart form data and refreshes the image lists', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify(anImage({ status: 0, statusName: 'pending' })), { status: 200 })
    )
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRequestTeamImage(), {
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

    const { result } = renderHook(() => useRequestTeamImage(), {
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

describe('useApproveTeamImage', () => {
  it('passes a comment through as a query param', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(anImage()), { status: 200 }))

    const { result } = renderHook(() => useApproveTeamImage(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ imageId: 5, comment: 'looks good' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(fetchMock.mock.calls[0][0].url).searchParams.get('comment')).toBe('looks good')
  })
})

describe('useRejectTeamImage', () => {
  it('sends no comment param when the moderator gave no reason', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify(anImage({ status: 2 })), { status: 200 })
    )

    const { result } = renderHook(() => useRejectTeamImage(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ imageId: 5 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(fetchMock.mock.calls[0][0].url).search).toBe('')
  })
})
