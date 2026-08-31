import { createFileRoute, useLocation } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Loader } from '@/components/ui/Loader'
import { usePluginContext } from '@/contexts/PluginContext'
import { useIntl } from '@/i18n'
import { isCoreAppPath } from '@/lib/pluginRoutes'

/**
 * Catch-all route that handles plugin-defined custom routes
 * This allows plugins to register their own paths like:
 * - /example
 * - /challenge/:challengeId/tasks/:taskId
 */
const DynamicPluginRoute = () => {
  const { t } = useIntl()
  const location = useLocation()
  const { getPluginPageByPath, loading } = usePluginContext()
  const isCorePath = isCoreAppPath(location.pathname)
  const pageMatch = isCorePath ? null : getPluginPageByPath(location.pathname)

  if (isCorePath) {
    return null
  }

  if (loading) {
    return (
      <Loader
        isFullScreen
        message={t('dynamicPluginRoute.loading', undefined, 'Loading plugin page...')}
      />
    )
  }

  if (!pageMatch) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{t('common.pageNotFound', undefined, 'Page Not Found')}</AlertTitle>
          <AlertDescription>
            {t(
              'dynamicPluginRoute.notFoundDescription',
              undefined,
              'The requested plugin page could not be found.'
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const PageComponent = pageMatch.page.component

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PageComponent params={pageMatch.params} />
    </div>
  )
}

export const Route = createFileRoute('/_app/$')({
  component: DynamicPluginRoute,
})
