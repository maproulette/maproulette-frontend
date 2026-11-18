import { Link, useRouter } from '@tanstack/react-router'
import { HTTPError } from 'ky'
import { Home, RefreshCw, TriangleAlert } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Empty'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

interface ErrorPageProps {
  title: string
  description: string
  details?: ReactNode
  canRetry?: boolean
}

const ErrorPage = ({ title, description, details, canRetry }: ErrorPageProps) => {
  const { t } = useIntl()
  const router = useRouter()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {details}
      <EmptyContent className="flex-row justify-center">
        {/* Invalidating re-runs the failed loaders and resets the error boundaries */}
        {canRetry && (
          <Button variant="outline" onClick={() => router.invalidate()}>
            <RefreshCw />
            {t({ id: 'errorBoundary.actions.tryAgain', defaultMessage: 'Try Again' })}
          </Button>
        )}
        <Button asChild>
          <Link to="/">
            <Home />
            {t({ id: 'errorBoundary.actions.goHome', defaultMessage: 'Go Home' })}
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export const NotFound = () => {
  const { t } = useIntl()
  return (
    <ErrorPage
      title={t({ id: 'common.pageNotFound', defaultMessage: 'Page Not Found' })}
      description={t({
        id: 'shared.notFound.description',
        defaultMessage: 'The page you are looking for does not exist.',
      })}
    />
  )
}

/** Error component for every route; picks its copy from the HTTP status, if any. */
export const RouteErrorBoundary = ({ error }: { error: Error }) => {
  const { t } = useIntl()

  useEffect(() => {
    logger.error('Route error caught', { error })
  }, [error])

  const status = error instanceof HTTPError ? error.response.status : undefined
  if (status === 404) return <NotFound />

  const details = import.meta.env.DEV ? (
    <pre className="max-w-2xl overflow-auto rounded bg-muted p-4 text-left text-sm">
      {error.message}
      {'\n\n'}
      {error.stack}
    </pre>
  ) : undefined

  if (status === 403) {
    return (
      <ErrorPage
        title={t({ id: 'errorBoundary.forbidden.title', defaultMessage: '403 - Forbidden' })}
        description={t({
          id: 'errorBoundary.forbidden.description',
          defaultMessage: "You don't have permission to access this resource.",
        })}
      />
    )
  }
  if (status === 401) {
    return (
      <ErrorPage
        title={t({ id: 'errorBoundary.unauthorized.title', defaultMessage: '401 - Unauthorized' })}
        description={t({
          id: 'errorBoundary.unauthorized.signInDescription',
          defaultMessage: 'You need to sign in to view this page.',
        })}
      />
    )
  }
  if (status !== undefined && status >= 500) {
    return (
      <ErrorPage
        title={t({ id: 'errorBoundary.serverError.title', defaultMessage: 'Server Error' })}
        description={t({
          id: 'errorBoundary.serverError.description',
          defaultMessage: 'The server encountered an error. Please try again later.',
        })}
        details={details}
        canRetry
      />
    )
  }
  if (status !== undefined) {
    return (
      <ErrorPage
        title={t(
          { id: 'errorBoundary.genericHttp.title', defaultMessage: 'Error {status}' },
          { status }
        )}
        description={t({
          id: 'errorBoundary.genericHttp.description',
          defaultMessage: 'An unexpected error occurred while loading this page.',
        })}
        details={details}
        canRetry
      />
    )
  }
  return (
    <ErrorPage
      title={t({ id: 'common.error', defaultMessage: 'Something went wrong' })}
      description={t({
        id: 'common.unexpectedErrorTryAgain',
        defaultMessage: 'An unexpected error occurred. Please try again.',
      })}
      details={details}
      canRetry
    />
  )
}

export const FullPageRouteError = ({ error }: { error: Error }) => (
  <div className="flex min-h-svh flex-col">
    <RouteErrorBoundary error={error} />
  </div>
)

export const FullPageNotFound = () => (
  <div className="flex min-h-svh flex-col">
    <NotFound />
  </div>
)
