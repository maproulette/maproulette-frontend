import { apiRequest } from './client'

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

/**
 * Run a GraphQL query against the backend.
 *
 * Nearly everything MapRoulette does is REST; GraphQL is used only where the
 * REST API has no equivalent — the activity feed of followed mappers, whose
 * `recentActions` query takes a set of OSM ids. It goes through the same ky
 * instance as the REST calls so it inherits credentials and the API key.
 */
export const graphqlRequest = async <T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> => {
  const body = await apiRequest
    .post('graphql', { json: { query, variables } })
    .json<GraphQLResponse<T>>()

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join('; '))
  }
  if (!body.data) {
    throw new Error('GraphQL response contained no data')
  }
  return body.data
}
