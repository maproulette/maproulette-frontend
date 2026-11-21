import type { QueryClient } from '@tanstack/react-query'
import { queryOptions, useQuery } from '@tanstack/react-query'
import type { OAuthCallbackResponse, OAuthLoginResponse } from '@/types/Oauth'
import type { UserWhoamiResponse } from '@/types/User'
import { apiRequest } from '../client'

export const userAuth = {
  // The backend works out the OAuth redirect_uri from this request's Origin
  // header, so we don't pass one. We don't pass a redirect param either:
  // AuthContext remembers where to go after sign-in.
  authenticate: async () => await apiRequest.get('auth/authenticate').json<OAuthLoginResponse>(),

  signOut: async () => await apiRequest.get('auth/signout').json<void>(),

  // The backend checks state against the one it stored in the session at
  // auth/authenticate, and reuses the redirect_uri it stored there too.
  callback: async (code: string, state: string) =>
    await apiRequest
      .get('auth/callback', { searchParams: { code, state } })
      .json<OAuthCallbackResponse>(),

  whoAmI: (isLoggedOut: boolean) =>
    useQuery(
      queryOptions({
        queryKey: ['user', 'whoami'],
        queryFn: () => apiRequest.get('api/v2/user/whoami').json<UserWhoamiResponse>(),
        enabled: !isLoggedOut,
        retry: false,
      })
    ),

  refreshAuth: async (queryClient: QueryClient) => {
    await queryClient.invalidateQueries({ queryKey: ['user', 'whoami'] })
    await queryClient.invalidateQueries({ queryKey: ['user'] })
  },

  clearAuth: (queryClient: QueryClient) => {
    queryClient.removeQueries({ queryKey: ['user', 'whoami'] })
    queryClient.resetQueries()
  },
}
