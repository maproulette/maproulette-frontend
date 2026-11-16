import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

/** A QueryClient configured for tests: no retries, no background refetching. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

/** A renderHook `wrapper` that provides the given (or a fresh) QueryClient. */
export function queryClientWrapper(queryClient: QueryClient = createTestQueryClient()) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}
