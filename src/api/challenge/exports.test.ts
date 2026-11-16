// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { __testing, challengeExports } from './exports'

const { exportFilename } = __testing

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/**
 * happy-dom has no object-URL support and clicking a real anchor would try to
 * navigate, so the save step is stubbed and observed instead.
 */
const stubDownload = () => {
  const createObjectURL = vi.fn(() => 'blob:mock')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    // Captured while still attached, since the hook removes the link right after.
    clicked.push({ href: this.href, download: this.download, attached: this.isConnected })
  })
  const clicked: Array<{ href: string; download: string; attached: boolean }> = []
  return { clicked, click, createObjectURL, revokeObjectURL }
}

describe('exportFilename', () => {
  it('uses the challenge name, made filename-safe', () => {
    expect(
      exportFilename({ challengeId: 7, challengeName: 'Missing  Sidewalks!', format: 'csv' })
    ).toBe('Missing-Sidewalks.csv')
  })

  it('falls back to the challenge id when there is no usable name', () => {
    expect(exportFilename({ challengeId: 7, challengeName: null, format: 'geojson' })).toBe(
      'challenge-7.geojson'
    )
    expect(exportFilename({ challengeId: 7, challengeName: '???', format: 'csv' })).toBe(
      'challenge-7.csv'
    )
  })

  it('keeps the name to a manageable length', () => {
    const name = 'a'.repeat(200)
    expect(exportFilename({ challengeId: 7, challengeName: name, format: 'csv' })).toBe(
      `${'a'.repeat(80)}.csv`
    )
  })
})

describe('challengeExports.useExportChallenge', () => {
  it('downloads a CSV from the extract endpoint and saves it under the challenge name', async () => {
    const fetchMock = stubFetch(new Response('id,status\n1,3', { status: 200 }))
    const { clicked, revokeObjectURL } = stubDownload()

    const { result } = renderHook(() => challengeExports.useExportChallenge(), {
      wrapper: queryClientWrapper(),
    })
    await result.current.mutateAsync({
      challengeId: 7,
      challengeName: 'Sidewalks',
      format: 'csv',
    })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(new URL(request.url).pathname).toBe('/api/v2/challenge/7/tasks/extract')
    expect(await request.clone().json()).toEqual({})

    expect(clicked).toEqual([{ href: 'blob:mock', download: 'Sidewalks.csv', attached: true }])
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    expect(document.querySelector('a')).toBeNull()
  })

  it('downloads GeoJSON from the view endpoint', async () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))
    const { clicked } = stubDownload()

    const { result } = renderHook(() => challengeExports.useExportChallenge(), {
      wrapper: queryClientWrapper(),
    })
    await result.current.mutateAsync({ challengeId: 7, format: 'geojson' })

    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toBe('/api/v2/challenge/view/7')
    expect(clicked[0].download).toBe('challenge-7.geojson')
  })

  it('passes the task table filters through as query params', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    stubDownload()

    const { result } = renderHook(() => challengeExports.useExportChallenge(), {
      wrapper: queryClientWrapper(),
    })
    await result.current.mutateAsync({
      challengeId: 7,
      format: 'csv',
      taskStatuses: [0, 3],
      priorities: [0],
      reviewStatuses: [2, 4],
      timezone: '+02:00',
    })

    const url = new URL(fetchMock.mock.calls[0][0].url)
    expect(url.searchParams.get('status')).toBe('0,3')
    expect(url.searchParams.get('priority')).toBe('0')
    expect(url.searchParams.get('reviewStatus')).toBe('2,4')
    expect(url.searchParams.get('timezone')).toBe('+02:00')
  })

  it('sends no filter params when nothing is filtered', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    stubDownload()

    const { result } = renderHook(() => challengeExports.useExportChallenge(), {
      wrapper: queryClientWrapper(),
    })
    await result.current.mutateAsync({
      challengeId: 7,
      format: 'csv',
      taskStatuses: [],
      priorities: [],
      reviewStatuses: [],
      timezone: '',
    })

    expect(new URL(fetchMock.mock.calls[0][0].url).search).toBe('')
  })

  it('sends a property filter in the body, where a nested rule tree fits', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    stubDownload()
    const taskPropertySearch = {
      key: 'surface',
      value: 'gravel',
      operator: 'equals',
    } as unknown as NonNullable<
      Parameters<
        ReturnType<typeof challengeExports.useExportChallenge>['mutateAsync']
      >[0]['taskPropertySearch']
    >

    const { result } = renderHook(() => challengeExports.useExportChallenge(), {
      wrapper: queryClientWrapper(),
    })
    await result.current.mutateAsync({ challengeId: 7, format: 'csv', taskPropertySearch })

    expect(await fetchMock.mock.calls[0][0].clone().json()).toEqual({ taskPropertySearch })
  })
})
