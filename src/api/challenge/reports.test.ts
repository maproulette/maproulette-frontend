// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { allChallengeReportsOptions, useReportChallenge, useUpdateReportStatus } from './reports'

afterEach(() => {
  vi.unstubAllGlobals()
})

const report = {
  id: 7,
  challengeId: 3,
  comment: 'This challenge is causing bad edits',
  status: 0,
  statusName: 'open',
  reportedAt: '2026-09-01T00:00:00Z',
  fullCount: 1,
}

describe('allChallengeReportsOptions', () => {
  it('sends the triage filters as search params', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([report]), { status: 200 }))

    const { result } = renderHook(
      () =>
        useQuery(
          allChallengeReportsOptions({ status: 'open', activeOnly: true, limit: 10, page: 2 })
        ),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([report])
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/reports')
    expect(request.url).toContain('status=open')
    expect(request.url).toContain('activeOnly=true')
    expect(request.url).toContain('limit=10')
    expect(request.url).toContain('page=2')
  })

  it('omits the status and challenge filters when they are not set', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => useQuery(allChallengeReportsOptions()), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).not.toContain('status=')
    expect(request.url).not.toContain('challengeId=')
    expect(request.url).toContain('activeOnly=false')
  })
})

describe('useReportChallenge', () => {
  it('omits the email when the reporter left it blank', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(report), { status: 201 }))

    const { result } = renderHook(() => useReportChallenge(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ challengeId: 3, comment: 'a'.repeat(100) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(await request.clone().json()).toEqual({ comment: 'a'.repeat(100) })
  })
})

describe('useUpdateReportStatus', () => {
  it('puts the triage decision with its note', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ ...report, status: 1, statusName: 'actioned' }), {
        status: 200,
      })
    )

    const { result } = renderHook(() => useUpdateReportStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ reportId: 7, status: 'actioned', reviewComment: 'archived it' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/report/7/status')
    expect(request.method).toBe('PUT')
    expect(await request.clone().json()).toEqual({
      status: 'actioned',
      reviewComment: 'archived it',
    })
  })

  it('omits the note when none was given', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(report), { status: 200 }))

    const { result } = renderHook(() => useUpdateReportStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ reportId: 7, status: 'dismissed' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(await request.clone().json()).toEqual({ status: 'dismissed' })
  })
})
