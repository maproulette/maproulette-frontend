import { type QueryClient, queryOptions } from '@tanstack/react-query'
import type { OAuthCallbackResponse, OAuthLoginResponse } from '@/types/Oauth'
import type { UserWhoamiResponse } from '@/types/User'
import { apiRequest } from '../client'
import { userKeys } from './keys'

// The backend works out the OAuth redirect_uri from this request's Origin
// header, so we don't pass one. We don't pass a redirect param either:
// AuthContext remembers where to go after sign-in.
export const authenticate = () => apiRequest.get('auth/authenticate').json<OAuthLoginResponse>()

// The backend checks state against the one it stored in the session at
// auth/authenticate, and reuses the redirect_uri it stored there too.
export const oauthCallback = (code: string, state: string) =>
  apiRequest.get('auth/callback', { searchParams: { code, state } }).json<OAuthCallbackResponse>()

export const signOut = () => apiRequest.get('auth/signout').json<void>()

export const whoamiOptions = () =>
  queryOptions({
    queryKey: userKeys.whoami,
    queryFn: () => apiRequest.get('api/v2/user/whoami').json<UserWhoamiResponse>(),
    retry: false,
  })

export const refreshAuth = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({ queryKey: userKeys.whoami })
  await queryClient.invalidateQueries({ queryKey: userKeys.all })
}

export const clearAuth = (queryClient: QueryClient) => {
  queryClient.removeQueries({ queryKey: userKeys.whoami })
  queryClient.resetQueries()
}
