import { Link } from '@tanstack/react-router'
import { HTTPError } from 'ky'
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

interface RouteErrorBoundaryProps {
  error: Error
  reset?: () => void
}

interface ErrorLayoutProps {
  title: string
  description: string
  icon: React.ReactNode
  details?: React.ReactNode
  actions: React.ReactNode
}

const ErrorLayout = ({ title, description, icon, details, actions }: ErrorLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <div className="text-center">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h1 className="mb-2 font-bold text-base">{title}</h1>
      <p className="mb-6 text-zinc-500 dark:text-slate-400">{description}</p>
      {details}
      <div className="mt-6 flex justify-center gap-4">{actions}</div>
    </div>
  </div>
)

const NotFoundError = () => {
  const { t } = useIntl()
  return (
    <ErrorLayout
      title={t({ id: 'errorBoundary.notFound.title', defaultMessage: '404 - Not Found' })}
      description={t({
        id: 'errorBoundary.notFound.description',
        defaultMessage: "The page or resource you're looking for doesn't exist.",
      })}
      icon={<AlertCircle className="h-16 w-16 text-yellow-500" />}
      actions={
        <>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t({ id: 'errorBoundary.actions.goBack', defaultMessage: 'Go Back' })}
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.goHome', defaultMessage: 'Go Home' })}
            </Link>
          </Button>
        </>
      }
    />
  )
}

const ForbiddenError = () => {
  const { t } = useIntl()
  return (
    <ErrorLayout
      title={t({ id: 'errorBoundary.forbidden.title', defaultMessage: '403 - Forbidden' })}
      description={t({
        id: 'errorBoundary.forbidden.description',
        defaultMessage: "You don't have permission to access this resource.",
      })}
      icon={<AlertCircle className="h-16 w-16 text-orange-500" />}
      actions={
        <>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t({ id: 'errorBoundary.actions.goBack', defaultMessage: 'Go Back' })}
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.goHome', defaultMessage: 'Go Home' })}
            </Link>
          </Button>
        </>
      }
    />
  )
}

const UnauthorizedError = () => {
  const { t } = useIntl()
  return (
    <ErrorLayout
      title={t({ id: 'errorBoundary.unauthorized.title', defaultMessage: '401 - Unauthorized' })}
      description={t({
        id: 'errorBoundary.unauthorized.description',
        defaultMessage: 'You need to be logged in to access this resource.',
      })}
      icon={<AlertCircle className="h-16 w-16 text-red-500" />}
      actions={
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            {t({ id: 'errorBoundary.actions.goToLogin', defaultMessage: 'Go to Login' })}
          </Link>
        </Button>
      }
    />
  )
}

const ServerError = ({ error, reset }: { error: HTTPError; reset?: () => void }) => {
  const { t } = useIntl()
  return (
    <ErrorLayout
      title={t({ id: 'errorBoundary.serverError.title', defaultMessage: 'Server Error' })}
      description={t({
        id: 'errorBoundary.serverError.description',
        defaultMessage: 'The server encountered an error. Please try again later.',
      })}
      icon={<AlertCircle className="h-16 w-16 text-red-500" />}
      details={
        import.meta.env.DEV ? (
          <pre className="mt-4 max-w-2xl overflow-auto rounded bg-zinc-100 p-4 text-left text-sm dark:bg-slate-800">
            {error.message}
          </pre>
        ) : undefined
      }
      actions={
        <>
          {reset && (
            <Button onClick={reset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.tryAgain', defaultMessage: 'Try Again' })}
            </Button>
          )}
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.goHome', defaultMessage: 'Go Home' })}
            </Link>
          </Button>
        </>
      }
    />
  )
}

const GenericHttpError = ({ error, reset }: { error: HTTPError; reset?: () => void }) => {
  const { t } = useIntl()
  return (
    <ErrorLayout
      title={t(
        { id: 'errorBoundary.genericHttp.title', defaultMessage: 'Error {status}' },
        { status: error.response.status }
      )}
      description={t({
        id: 'errorBoundary.genericHttp.description',
        defaultMessage: 'An unexpected error occurred while loading this page.',
      })}
      icon={<AlertCircle className="h-16 w-16 text-red-500" />}
      details={
        import.meta.env.DEV ? (
          <pre className="mt-4 max-w-2xl overflow-auto rounded bg-zinc-100 p-4 text-left text-sm dark:bg-slate-800">
            {error.message}
          </pre>
        ) : undefined
      }
      actions={
        <>
          {reset && (
            <Button onClick={reset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.tryAgain', defaultMessage: 'Try Again' })}
            </Button>
          )}
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.goHome', defaultMessage: 'Go Home' })}
            </Link>
          </Button>
        </>
      }
    />
  )
}

const GenericError = ({ error, reset }: { error: Error; reset?: () => void }) => {
  const { t } = useIntl()
  return (
    <ErrorLayout
      title={t({ id: 'common.error', defaultMessage: 'Something went wrong' })}
      description={t({
        id: 'common.unexpectedErrorTryAgain',
        defaultMessage: 'An unexpected error occurred. Please try again.',
      })}
      icon={<AlertCircle className="h-16 w-16 text-red-500" />}
      details={
        import.meta.env.DEV ? (
          <pre className="mt-4 max-w-2xl overflow-auto rounded bg-zinc-100 p-4 text-left text-sm dark:bg-slate-800">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        ) : undefined
      }
      actions={
        <>
          {reset && (
            <Button onClick={reset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.tryAgain', defaultMessage: 'Try Again' })}
            </Button>
          )}
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              {t({ id: 'errorBoundary.actions.goHome', defaultMessage: 'Go Home' })}
            </Link>
          </Button>
        </>
      }
    />
  )
}

/**
 * Route-level error boundary component that handles different error types
 * with appropriate UI and user guidance.
 *
 * Handles:
 * - 404 Not Found
 * - 403 Forbidden
 * - 401 Unauthorized
 * - 500 Server Errors
 * - Generic errors
 */
export const RouteErrorBoundary = ({ error, reset }: RouteErrorBoundaryProps) => {
  // Log the error for debugging, once per occurrence rather than on every re-render
  useEffect(() => {
    logger.error('Route error caught', { error })
  }, [error])

  // Handle HTTP errors from API
  if (error instanceof HTTPError) {
    const status = error.response.status

    switch (status) {
      case 404:
        return <NotFoundError />
      case 403:
        return <ForbiddenError />
      case 401:
        return <UnauthorizedError />
      case 500:
      case 502:
      case 503:
        return <ServerError error={error} reset={reset} />
      default:
        return <GenericHttpError error={error} reset={reset} />
    }
  }

  // Handle generic errors
  return <GenericError error={error} reset={reset} />
}
