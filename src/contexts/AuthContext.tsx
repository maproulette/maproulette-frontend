import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useSearch } from '@tanstack/react-router'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, apiRequest } from '@/api'
import { Loader } from '@/components/ui/Loader'
import { logger } from '@/lib/logger'
import type { OAuthLoginResponse } from '@/types/Oauth'
import type { User } from '@/types/User'

interface ApiError {
  name: string
  message: string
  status: number
  statusText: string
  data?: unknown
}

type AuthParams = {
  code: string
  state: string
}

export interface AuthContextType {
  user: User | undefined
  isAuthenticated: boolean
  authLoading: boolean
  error: Error | null
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const isSecurityError = (error: ApiError): boolean => {
  return error.status === 401 || error.status === 403
}

export const validateOAuthState = (state: string | null): boolean => {
  const storedState = localStorage.getItem('state')
  if (!storedState || !state) {
    logger.warn('[Auth] OAuth state validation failed: missing state')
    return false
  }
  if (storedState !== state) {
    logger.error('[Auth] OAuth state mismatch - potential CSRF attack')
    return false
  }
  return true
}

export const setOAuthState = (state: string): void => {
  localStorage.setItem('state', state)
}

export const clearOAuthState = (): void => {
  localStorage.removeItem('state')
}

export const setStoredRedirectUrl = (url: string): void => {
  localStorage.setItem('redirect', url)
}

export const getStoredRedirectUrl = (): string | null => {
  return localStorage.getItem('redirect')
}

export const clearStoredRedirectUrl = (): void => {
  localStorage.removeItem('redirect')
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedOut, setIsLoggedOut] = useState(false)
  const [isVerifying, setIsVerifying] = useState(() =>
    new URLSearchParams(window.location.search).has('code')
  )
  const search = useSearch({ from: '/_app' }) as AuthParams
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: user, isLoading, error } = api.user.whoAmI(isLoggedOut)
  const [codeUsed, setCodeUsed] = useState<boolean>(false)

  const stripOAuthParamsFromUrl = (): void => {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState({}, '', url.toString())
  }

  const processCallback = async (): Promise<void> => {
    const code = search.code
    const state = search.state

    if (!validateOAuthState(state)) {
      clearOAuthState()
      stripOAuthParamsFromUrl()
      setIsVerifying(false)
      return
    }

    setIsVerifying(true)

    try {
      const { token } = await api.user.callback(code)

      if (token) {
        localStorage.setItem('osm_token', token)
        setIsLoggedOut(false)
        api.user.refreshAuth(queryClient)

        const redirectUrl = getStoredRedirectUrl()
        if (redirectUrl) {
          clearStoredRedirectUrl()
          clearOAuthState()
          window.location.replace(redirectUrl)
          return
        }
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      if (isSecurityError(apiError)) {
        api.user.refreshAuth(queryClient)
      } else {
        logger.error('OAuth callback error', { error })
      }
    } finally {
      stripOAuthParamsFromUrl()
      clearOAuthState()
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    const code = search.code

    if (code && !codeUsed) {
      setCodeUsed(true)
    }
  }, [codeUsed, search.code])

  useEffect(() => {
    const code = search.code

    if (code && codeUsed) {
      processCallback()
    }
  }, [codeUsed, search.code])

  useEffect(() => {
    if (user && isLoggedOut) {
      setIsLoggedOut(false)
    }
  }, [user, isLoggedOut])

  const osmToken = user?.osmProfile?.requestToken
  const lastStoredTokenRef = useRef<string | null>(null)
  useEffect(() => {
    if (osmToken && lastStoredTokenRef.current !== osmToken) {
      localStorage.setItem('osm_token', osmToken)
      lastStoredTokenRef.current = osmToken
    }
  }, [osmToken])

  useEffect(() => {
    if (error) {
      const apiError = error as ApiError
      if (isSecurityError(apiError)) {
        api.user.clearAuth(queryClient)
        setIsLoggedOut(true)
      }
    }
  }, [error, queryClient])

  const login = useCallback(async (): Promise<void> => {
    const currentUrl = location.pathname + location.searchStr
    setStoredRedirectUrl(currentUrl)

    try {
      // Hit the backend via the shared apiRequest client (same host as the
      // callback) so the backend derives the OAuth redirect_uri from this
      // request's Origin header, which resolves correctly across deployments
      // (maproulette.org, beta.maproulette.org, 127.0.0.1). No redirect param:
      // post-login navigation is handled client-side via the stored redirect URL.
      const response = await apiRequest.get('auth/authenticate')
      const jsonData = (await response.json()) as OAuthLoginResponse

      if (jsonData.state) {
        setOAuthState(jsonData.state)
        window.location.href = jsonData.redirect
      }
    } catch (error) {
      logger.error('Login failed', { error })
    }
  }, [location, queryClient])

  const logout = useCallback(async (): Promise<void> => {
    clearOAuthState()
    localStorage.removeItem('osm_token')

    try {
      await api.user.signOut()
    } catch (error) {
      logger.error('Logout error', { error })
    } finally {
      api.user.clearAuth(queryClient)
      setIsLoggedOut(true)
    }
  }, [queryClient])

  const value: AuthContextType = useMemo(
    () => ({
      user,
      authLoading: isLoading || isVerifying,
      isAuthenticated: !!user,
      error,
      login,
      logout,
    }),
    [user, isLoading, isVerifying, error, login, logout]
  )

  if (isLoading || isVerifying) {
    return <Loader isFullScreen />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
