import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, ErrorComponent, RouterProvider } from '@tanstack/react-router'
import { HTTPError } from 'ky'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { IntlProvider } from '@/i18n'

import { routeTree } from './routeTree.gen'

import './main.css'
import { NotFound } from '@/components/shared/NotFound'
import { Loader } from '@/components/ui/Loader'
import { setAppRouter } from '@/lib/routerRef'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        if (error instanceof HTTPError) {
          const status = error.response.status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        return failureCount < 3
      },
    },
  },
})

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: () => {
    return <NotFound />
  },
  defaultErrorComponent: ErrorComponent,
  defaultPendingComponent: () => <Loader isFullScreen />,
})

setAppRouter(router)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <IntlProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ThemeProvider>
      </IntlProvider>
    </StrictMode>
  )
}
