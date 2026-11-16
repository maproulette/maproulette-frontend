import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { FullPageNotFound, FullPageRouteError } from '@/components/shared/ErrorPages'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  errorComponent: FullPageRouteError,
  notFoundComponent: FullPageNotFound,
  head: () => ({
    meta: [
      {
        title: window.env.VITE_APP_NAME,
      },
      {
        name: 'description',
        content: window.env.VITE_APP_DESCRIPTION,
      },
    ],
  }),
  component: () => {
    return (
      <>
        <HeadContent />
        <Outlet />
        <Scripts />
        {import.meta.env.DEV && (
          <>
            <TanStackDevtools
              config={{
                position: 'bottom-left',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
            <ReactQueryDevtools buttonPosition="bottom-right" />
          </>
        )}
      </>
    )
  },
})
