import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { FullPageRouteError } from '@/components/shared/ErrorPages'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
  // Routes below this one get the default error component, inside the layout
  errorComponent: FullPageRouteError,
})
