// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubFetch } from '@/test/stubFetch'
import { graphqlRequest } from './graphql'

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('graphqlRequest', () => {
  it('posts the query and variables to the graphql endpoint', async () => {
    const fetchMock = stubFetch(jsonResponse({ data: { recentActions: [] } }))

    const data = await graphqlRequest('query Q { thing }', { limit: 5 })

    expect(data).toEqual({ recentActions: [] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(new URL(request.url).pathname).toBe('/graphql')
    expect(await request.clone().json()).toEqual({
      query: 'query Q { thing }',
      variables: { limit: 5 },
    })
  })

  it('sends no variables when the query takes none', async () => {
    const fetchMock = stubFetch(jsonResponse({ data: { ok: true } }))

    await graphqlRequest('query Q { thing }')

    const [request] = fetchMock.mock.calls[0]
    expect(await request.clone().json()).toEqual({ query: 'query Q { thing }' })
  })

  it('throws with every error the server reported', async () => {
    stubFetch(jsonResponse({ errors: [{ message: 'bad osmIds' }, { message: 'no such field' }] }))

    await expect(graphqlRequest('query Q { thing }')).rejects.toThrow('bad osmIds; no such field')
  })

  it('throws when the response carries neither data nor errors', async () => {
    stubFetch(jsonResponse({}))

    await expect(graphqlRequest('query Q { thing }')).rejects.toThrow(
      'GraphQL response contained no data'
    )
  })

  it('ignores an empty errors list and returns the data', async () => {
    stubFetch(jsonResponse({ errors: [], data: { ok: true } }))

    await expect(graphqlRequest('query Q { thing }')).resolves.toEqual({ ok: true })
  })
})
