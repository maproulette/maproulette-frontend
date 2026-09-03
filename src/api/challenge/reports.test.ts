// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengeReports } from './reports'

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

describe('challengeReports.myOpenReport', () => {
  it("fetches the user's own open report for a challenge", async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(report), { status: 200 }))

    const { result } = renderHook(() => challengeReports.myOpenReport(3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(report)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/3/report/mine')
  })

  it('resolves to null for the 204 the backend sends when there is no open report', async () => {
    stubFetch(new Response(null, { status: 204 }))

    const { result } = renderHook(() => challengeReports.myOpenReport(3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))

    const { result } = renderHook(() => challengeReports.myOpenReport(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is disabled when explicitly not enabled', () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))

    const { result } = renderHook(() => challengeReports.myOpenReport(3, false), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeReports.reports', () => {
  it('sends the triage filters as search params', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([report]), { status: 200 }))

    const { result } = renderHook(
      () => challengeReports.reports({ status: 'open', activeOnly: true, limit: 10, page: 2 }),
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

    const { result } = renderHook(() => challengeReports.reports(), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).not.toContain('status=')
    expect(request.url).not.toContain('challengeId=')
    expect(request.url).toContain('activeOnly=false')
  })
})

describe('challengeReports.useReportChallenge', () => {
  it('posts the report and invalidates the challenge comment lists it also wrote to', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(report), { status: 201 }))
    const client = createTestQueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => challengeReports.useReportChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate({
      challengeId: 3,
      comment: 'This challenge is causing bad edits',
      email: 'mapper@example.com',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/3/report')
    expect(await request.clone().json()).toEqual({
      comment: 'This challenge is causing bad edits',
      email: 'mapper@example.com',
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['challengeReport'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['challenge', 'comments', 3] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['challenge', 'taskComments', 3] })
  })

  it('omits the email when the reporter left it blank', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(report), { status: 201 }))

    const { result } = renderHook(() => challengeReports.useReportChallenge(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ challengeId: 3, comment: 'a'.repeat(100) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(await request.clone().json()).toEqual({ comment: 'a'.repeat(100) })
  })
})

describe('challengeReports.useUpdateReportStatus', () => {
  it('puts the triage decision with its note', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ ...report, status: 1, statusName: 'actioned' }), {
        status: 200,
      })
    )

    const { result } = renderHook(() => challengeReports.useUpdateReportStatus(), {
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

    const { result } = renderHook(() => challengeReports.useUpdateReportStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ reportId: 7, status: 'dismissed' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(await request.clone().json()).toEqual({ status: 'dismissed' })
  })
})
