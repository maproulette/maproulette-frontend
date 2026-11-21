// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengePropertyKeysOptions, taskIdsMatchingPropertiesOptions } from './multiple'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('taskIdsMatchingPropertiesOptions', () => {
  const propertySearch = {
    key: 'surface',
    value: 'gravel',
    operator: 'equal',
  } as unknown as NonNullable<Parameters<typeof taskIdsMatchingPropertiesOptions>[1]>

  it('resolves the property filter across the whole challenge, not the current view', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ total: 2, tasks: [{ id: 1 }, { id: 2 }] }), { status: 200 })
    )

    const { result } = renderHook(
      () => useQuery(taskIdsMatchingPropertiesOptions(7, propertySearch)),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(new Set([1, 2]))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect((request as Request).method).toBe('PUT')
    expect(url.pathname).toBe('/api/v2/tasks/box/-180/-85/180/85')
    expect(url.searchParams.get('cid')).toBe('7')
    expect(url.searchParams.get('includeGeometries')).toBe('false')
    expect(await (request as Request).clone().json()).toEqual({
      taskPropertySearch: propertySearch,
    })
  })
})

describe('challengePropertyKeysOptions', () => {
  it('collects the distinct property names across a sample of the challenge’s tasks', async () => {
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify({
          total: 2,
          tasks: [
            {
              id: 1,
              geometries: {
                features: [
                  { properties: { surface: 'gravel', highway: 'track' } },
                  { properties: null },
                ],
              },
            },
            { id: 2, geometries: { features: [{ properties: { access: 'yes' } }] } },
            { id: 3 },
          ],
        }),
        { status: 200 }
      )
    )

    const { result } = renderHook(() => useQuery(challengePropertyKeysOptions(7)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['access', 'highway', 'surface'])

    const url = new URL((fetchMock.mock.calls[0][0] as Request).url)
    expect(url.pathname).toBe('/api/v2/tasks/box/-180/-85/180/85')
    expect(url.searchParams.get('includeGeometries')).toBe('true')
  })

  it('has no names to offer when the sample comes back empty', async () => {
    stubFetch(new Response(JSON.stringify({ total: 0 }), { status: 200 }))

    const { result } = renderHook(() => useQuery(challengePropertyKeysOptions(7)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
