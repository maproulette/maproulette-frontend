import { AlertCircle, RefreshCw } from 'lucide-react'
import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { pluginLogger } from '@/lib/logger'

export type PluginErrorBoundaryProps = {
  children: ReactNode
  /** Stable id for the contribution (page, panel, history renderer, …). */
  contributionId?: string
  /** Short label shown in the fallback UI and console (e.g. "page", "panel"). */
  source?: string
  /** Compact fallback for tight slots (task footer, history rows). */
  compact?: boolean
  className?: string
}

type PluginErrorBoundaryState = {
  error: Error | null
}

/**
 * Isolates plugin UI failures so a bad remote bundle cannot blank the host app.
 * Always writes a structured console.error (message, stack, componentStack) even
 * when the plugin is minified — pair with plugin source maps to decode stacks.
 */
export class PluginErrorBoundary extends Component<
  PluginErrorBoundaryProps,
  PluginErrorBoundaryState
> {
  override state: PluginErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): PluginErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { contributionId, source } = this.props
    const label = [source, contributionId].filter(Boolean).join(':') || 'plugin'

    // Native Error as a separate console arg keeps the expandable stack in DevTools.
    console.error(
      `[Plugin] Render error in ${label}`,
      error,
      errorInfo.componentStack ?? '(no component stack)'
    )

    pluginLogger.error('Plugin render error', {
      source,
      contributionId,
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      error,
    })
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  override render() {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }

    const { contributionId, source, compact, className } = this.props
    const title = source ? `Plugin ${source} failed` : 'Plugin failed to render'

    if (compact) {
      return (
        <div className={className ?? 'space-y-2 py-1'}>
          <p className="text-red-600 text-xs dark:text-red-400">
            {title}
            {contributionId ? ` (${contributionId})` : ''}: {error.message}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={this.handleRetry}>
            <RefreshCw className="mr-1 size-3.5" />
            Retry
          </Button>
        </div>
      )
    }

    return (
      <div className={className ?? 'mx-auto max-w-2xl px-4 py-6'}>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{error.message}</p>
            {contributionId && (
              <p className="font-mono text-xs opacity-80">contribution: {contributionId}</p>
            )}
            <p className="text-xs opacity-80">
              Details were written to the browser console (message, stack, component stack).
            </p>
            <Button type="button" size="sm" variant="outline" onClick={this.handleRetry}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}

type WrapOptions = {
  contributionId: string
  source: string
  compact?: boolean
}

/**
 * Wrap a plugin contribution component so every host render site is isolated
 * without repeating PluginErrorBoundary at each call site.
 */
export const wrapPluginComponent = <P extends object>(
  ComponentToWrap: ComponentType<P>,
  { contributionId, source, compact = true }: WrapOptions
): ComponentType<P> => {
  const Wrapped = (props: P) => (
    <PluginErrorBoundary contributionId={contributionId} source={source} compact={compact}>
      <ComponentToWrap {...props} />
    </PluginErrorBoundary>
  )
  Wrapped.displayName = `PluginBoundary(${source}:${contributionId})`
  return Wrapped
}
