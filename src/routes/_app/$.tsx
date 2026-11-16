import { createFileRoute, useLocation } from '@tanstack/react-router'
import { NotFound } from '@/components/shared/ErrorPages'
import { Loader } from '@/components/ui/Loader'
import { usePluginContext } from '@/contexts/PluginContext'
import { useIntl } from '@/i18n'

/**
 * Anything the route tree doesn't match lands here. Plugins can register their
 * own pages (like /example or /challenge/:challengeId/tasks/:taskId), so check
 * those before giving up. This renders NotFound itself rather than throwing
 * notFound() from a loader, since plugin pages aren't known until the plugins
 * have loaded.
 */
const CatchAllRoute = () => {
  const { t } = useIntl()
  const location = useLocation()
  const { getPluginPageByPath, loading } = usePluginContext()

  if (loading) {
    return (
      <Loader
        isFullScreen
        message={t({ id: 'dynamicPluginRoute.loading', defaultMessage: 'Loading plugin page...' })}
      />
    )
  }

  const pageMatch = getPluginPageByPath(location.pathname)
  if (!pageMatch) return <NotFound />

  const PageComponent = pageMatch.page.component
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PageComponent params={pageMatch.params} />
    </div>
  )
}

export const Route = createFileRoute('/_app/$')({
  component: CatchAllRoute,
})
