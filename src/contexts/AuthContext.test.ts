// @vitest-environment happy-dom
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLocation, useSearch } from '@tanstack/react-router'
import { act, createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, apiRequest } from '@/api'
import { Loader } from '@/components/ui/Loader'
import { logger } from '@/lib/logger'
import { createTestQueryClient } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { waitFor } from '@/test/waitFor'
import type { User } from '@/types/User'
import {
  AuthProvider,
  clearOAuthState,
  getStoredRedirectUrl,
  isSecurityError,
  setOAuthState,
  setStoredRedirectUrl,
  useAuthContext,
  validateOAuthState,
} from './AuthContext'

vi.mock('@tanstack/react-router', () => ({
  useSearch: vi.fn(),
  useLocation: vi.fn(),
}))

vi.mock('@/api', () => ({
  api: {
    user: {
      whoAmI: vi.fn(),
      callback: vi.fn(),
      refreshAuth: vi.fn(),
      clearAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
  apiRequest: { get: vi.fn() },
}))

vi.mock('@/components/ui/Loader', () => ({ Loader: vi.fn(() => null) }))

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }))

describe('validateOAuthState', () => {
  afterEach(() => {
    clearOAuthState()
  })

  it('returns true when the state matches what was stored', () => {
    setOAuthState('abc123')
    expect(validateOAuthState('abc123')).toBe(true)
  })

  it('returns false when the state does not match what was stored', () => {
    setOAuthState('abc123')
    expect(validateOAuthState('xyz789')).toBe(false)
  })

  it('returns false when no state was stored', () => {
    expect(validateOAuthState('abc123')).toBe(false)
  })

  it('returns false when no state is passed', () => {
    setOAuthState('abc123')
    expect(validateOAuthState(null)).toBe(false)
  })

  it('returns false when neither a stored nor passed state exists', () => {
    expect(validateOAuthState(null)).toBe(false)
  })
})

describe('isSecurityError', () => {
  const baseError = { name: 'ApiError', message: 'failed', statusText: 'error' }

  it.each([401, 403])('returns true for status %i', (status) => {
    expect(isSecurityError({ ...baseError, status })).toBe(true)
  })

  it.each([200, 404, 500])('returns false for status %i', (status) => {
    expect(isSecurityError({ ...baseError, status })).toBe(false)
  })
})

type WhoAmIResult = ReturnType<typeof api.user.whoAmI>
type ApiRequestGetResult = ReturnType<typeof apiRequest.get>

const fakeUser = (overrides: { requestToken?: string } = {}): User =>
  ({
    id: 1,
    osmProfile: overrides.requestToken ? { requestToken: overrides.requestToken } : undefined,
  }) as unknown as User

const mockSearch = (value: { code?: string; state?: string }) => {
  vi.mocked(useSearch).mockReturnValue(value as unknown as ReturnType<typeof useSearch>)
}

const mockLocation = (value: { pathname: string; searchStr: string }) => {
  vi.mocked(useLocation).mockReturnValue(value as unknown as ReturnType<typeof useLocation>)
}

const mockWhoAmI = (result: { data?: User; isLoading?: boolean; error?: unknown }) => {
  vi.mocked(api.user.whoAmI).mockReturnValue({
    data: result.data,
    isLoading: result.isLoading ?? false,
    error: result.error ?? null,
  } as unknown as WhoAmIResult)
}

// Simulates the real hook's `enabled: !isLoggedOut` behavior so tests can
// observe context flipping to unauthenticated after logout/401 handling.
const mockWhoAmIDynamic = (user: User) => {
  vi.mocked(api.user.whoAmI).mockImplementation(
    ((isLoggedOut: boolean) =>
      ({
        data: isLoggedOut ? undefined : user,
        isLoading: false,
        error: null,
      }) as unknown as WhoAmIResult) as typeof api.user.whoAmI
  )
}

const mockAuthenticateResponse = (response: { state?: string; redirect?: string }) => {
  vi.mocked(apiRequest.get).mockReturnValue({
    json: () => Promise.resolve(response),
  } as unknown as ApiRequestGetResult)
}

const wrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AuthProvider, null, children)
    )

const mount = (queryClient: QueryClient = createTestQueryClient()) => {
  const rendered = renderHook(() => useAuthContext(), { wrapper: wrapper(queryClient) })
  return { ...rendered, queryClient }
}

describe('useAuthContext', () => {
  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuthContext())).toThrow(
      'useAuth must be used within an AuthProvider'
    )
  })

  it('exposes an unauthenticated context when there is no user and nothing is loading', () => {
    mockSearch({})
    mockLocation({ pathname: '/', searchStr: '' })
    mockWhoAmI({})

    const { result } = mount()

    expect(result.current.user).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.authLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('exposes the authenticated user once the whoAmI query resolves', () => {
    mockSearch({})
    mockLocation({ pathname: '/', searchStr: '' })
    const user = fakeUser()
    mockWhoAmI({ data: user })

    const { result } = mount()

    expect(result.current.user).toEqual(user)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('renders the loader and withholds context while the whoAmI query is loading', () => {
    mockSearch({})
    mockLocation({ pathname: '/', searchStr: '' })
    mockWhoAmI({ isLoading: true })

    const { result } = mount()

    expect(Loader).toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  describe('login', () => {
    it('stores the current location as the redirect target and navigates to the OAuth provider', async () => {
      mockSearch({})
      mockLocation({ pathname: '/challenges/5', searchStr: '?foo=bar' })
      mockWhoAmI({})
      mockAuthenticateResponse({
        state: 'oauth-state-1',
        redirect: 'https://osm.example/authorize',
      })

      const { result } = mount()

      await act(async () => {
        await result.current.login()
      })

      expect(localStorage.getItem('redirect')).toBe('/challenges/5?foo=bar')
      expect(localStorage.getItem('state')).toBe('oauth-state-1')
      expect(window.location.href).toContain('osm.example/authorize')
    })

    it('does not store oauth state or navigate when the response has no state', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})
      const originalHref = window.location.href
      mockAuthenticateResponse({ redirect: 'https://osm.example/authorize' })

      const { result } = mount()

      await act(async () => {
        await result.current.login()
      })

      expect(localStorage.getItem('state')).toBeNull()
      expect(window.location.href).toBe(originalHref)
    })

    it('logs and swallows errors from the authenticate request', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})
      vi.mocked(apiRequest.get).mockReturnValue({
        json: () => Promise.reject(new Error('network down')),
      } as unknown as ApiRequestGetResult)

      const { result } = mount()

      await act(async () => {
        await result.current.login()
      })

      expect(logger.error).toHaveBeenCalledWith('Login failed', { error: expect.any(Error) })
      expect(localStorage.getItem('state')).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears local auth state and marks the session logged out', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      localStorage.setItem('state', 'leftover-state')
      localStorage.setItem('osm_token', 'abc123')
      const queryClient = createTestQueryClient()
      mockWhoAmIDynamic(fakeUser())
      vi.mocked(api.user.signOut).mockResolvedValue(undefined)

      const { result } = mount(queryClient)
      expect(result.current.isAuthenticated).toBe(true)

      await act(async () => {
        await result.current.logout()
      })

      expect(localStorage.getItem('state')).toBeNull()
      expect(localStorage.getItem('osm_token')).toBeNull()
      expect(api.user.signOut).toHaveBeenCalled()
      expect(api.user.clearAuth).toHaveBeenCalledWith(queryClient)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('still clears auth state when signOut fails, and logs the error', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      const queryClient = createTestQueryClient()
      mockWhoAmIDynamic(fakeUser())
      vi.mocked(api.user.signOut).mockRejectedValue(new Error('signout failed'))

      const { result } = mount(queryClient)

      await act(async () => {
        await result.current.logout()
      })

      expect(logger.error).toHaveBeenCalledWith('Logout error', { error: expect.any(Error) })
      expect(api.user.clearAuth).toHaveBeenCalledWith(queryClient)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('resets isLoggedOut when the query still resolves a user, e.g. cached data lingering', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({ data: fakeUser() })
      vi.mocked(api.user.signOut).mockResolvedValue(undefined)

      const { result } = mount()
      expect(result.current.isAuthenticated).toBe(true)

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('401 handling on the whoAmI query', () => {
    it('clears the cached user and logs the session out on a 401', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      const queryClient = createTestQueryClient()
      mockWhoAmI({ error: { status: 401 } })

      mount(queryClient)

      await waitFor(() => {
        expect(api.user.clearAuth).toHaveBeenCalledWith(queryClient)
      })
      expect(vi.mocked(api.user.whoAmI).mock.calls.some(([loggedOut]) => loggedOut === true)).toBe(
        true
      )
    })

    it('clears the cached user and logs the session out on a 403, same as a 401', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      const queryClient = createTestQueryClient()
      mockWhoAmI({ error: { status: 403 } })

      mount(queryClient)

      await waitFor(() => {
        expect(api.user.clearAuth).toHaveBeenCalledWith(queryClient)
      })
      expect(vi.mocked(api.user.whoAmI).mock.calls.some(([loggedOut]) => loggedOut === true)).toBe(
        true
      )
    })

    it('does not clear the cached user on a non-security error, e.g. a 500', () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({ error: { status: 500 } })

      mount()

      expect(api.user.clearAuth).not.toHaveBeenCalled()
    })
  })

  describe('osm token persistence', () => {
    it('stores the osm request token in localStorage when present', async () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({ data: fakeUser({ requestToken: 'tok-1' }) })

      mount()

      await waitFor(() => {
        expect(localStorage.getItem('osm_token')).toBe('tok-1')
      })
    })

    it('does not write to localStorage again on a rerender with the same token', () => {
      mockSearch({})
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({ data: fakeUser({ requestToken: 'tok-1' }) })
      const setItemSpy = vi.spyOn(localStorage, 'setItem')

      const { rerender } = mount()
      rerender()

      const osmTokenCalls = setItemSpy.mock.calls.filter(([key]) => key === 'osm_token')
      expect(osmTokenCalls).toHaveLength(1)
    })
  })

  describe('OAuth callback handling', () => {
    it('exchanges the code for a token, stores it, and redirects to the stored URL', async () => {
      window.history.pushState({}, '', '/?code=the-code&state=matching-state')
      setOAuthState('matching-state')
      setStoredRedirectUrl('/dashboard')
      mockSearch({ code: 'the-code', state: 'matching-state' })
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})
      vi.mocked(api.user.callback).mockResolvedValue({ token: 'jwt-token' } as Awaited<
        ReturnType<typeof api.user.callback>
      >)

      mount()

      await waitFor(() => {
        expect(localStorage.getItem('osm_token')).toBe('jwt-token')
      })
      expect(api.user.callback).toHaveBeenCalledWith('the-code')
      expect(api.user.refreshAuth).toHaveBeenCalled()
      expect(window.location.href).toContain('/dashboard')
      expect(getStoredRedirectUrl()).toBeNull()
      expect(localStorage.getItem('state')).toBeNull()
    })

    it('exchanges the code and stays put when there is no stored redirect URL', async () => {
      window.history.pushState({}, '', '/?code=the-code&state=matching-state')
      setOAuthState('matching-state')
      mockSearch({ code: 'the-code', state: 'matching-state' })
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})
      const originalPath = window.location.origin + window.location.pathname
      vi.mocked(api.user.callback).mockResolvedValue({ token: 'jwt-token' } as Awaited<
        ReturnType<typeof api.user.callback>
      >)

      const { result } = mount()

      await waitFor(() => {
        expect(localStorage.getItem('osm_token')).toBe('jwt-token')
      })
      expect(api.user.refreshAuth).toHaveBeenCalled()
      // stripOAuthParamsFromUrl removes ?code/&state, but no external redirect happens
      expect(window.location.origin + window.location.pathname).toBe(originalPath)
      expect(window.location.search).toBe('')
      expect(result.current).not.toBeUndefined()
    })

    it('does nothing when the callback resolves without a token', async () => {
      window.history.pushState({}, '', '/?code=the-code&state=matching-state')
      setOAuthState('matching-state')
      mockSearch({ code: 'the-code', state: 'matching-state' })
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})
      vi.mocked(api.user.callback).mockResolvedValue(
        {} as Awaited<ReturnType<typeof api.user.callback>>
      )

      const { result } = mount()

      await waitFor(() => {
        expect(result.current).not.toBeUndefined()
      })
      expect(localStorage.getItem('osm_token')).toBeNull()
      expect(api.user.refreshAuth).not.toHaveBeenCalled()
    })

    it('discards the callback and recovers when the state does not match', async () => {
      window.history.pushState({}, '', '/?code=the-code&state=wrong-state')
      setOAuthState('expected-state')
      mockSearch({ code: 'the-code', state: 'wrong-state' })
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})

      const { result } = mount()

      await waitFor(() => {
        expect(result.current).not.toBeUndefined()
      })
      expect(localStorage.getItem('state')).toBeNull()
      expect(api.user.callback).not.toHaveBeenCalled()
      expect(result.current.authLoading).toBe(false)
    })

    it('refreshes auth instead of clearing it when the callback itself returns a security error', async () => {
      window.history.pushState({}, '', '/?code=the-code&state=matching-state')
      setOAuthState('matching-state')
      mockSearch({ code: 'the-code', state: 'matching-state' })
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})
      vi.mocked(api.user.callback).mockRejectedValue({ status: 401 })

      const { result } = mount()

      await waitFor(() => {
        expect(result.current).not.toBeUndefined()
      })
      expect(api.user.refreshAuth).toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalledWith('OAuth callback error', expect.anything())
    })

    it('logs the error and does not refresh auth when the callback fails for a non-security reason', async () => {
      window.history.pushState({}, '', '/?code=the-code&state=matching-state')
      setOAuthState('matching-state')
      mockSearch({ code: 'the-code', state: 'matching-state' })
      mockLocation({ pathname: '/', searchStr: '' })
      mockWhoAmI({})
      vi.mocked(api.user.callback).mockRejectedValue(new Error('server exploded'))

      const { result } = mount()

      await waitFor(() => {
        expect(result.current).not.toBeUndefined()
      })
      expect(logger.error).toHaveBeenCalledWith('OAuth callback error', {
        error: expect.any(Error),
      })
      expect(api.user.refreshAuth).not.toHaveBeenCalled()
    })
  })
})
