import { Network } from 'lucide-react'
import type React from 'react'
import { useId } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

export interface ClusterToggleProps {
  /** Whether the toggle is disabled */
  disabled?: boolean
  /** Current task count to display */
  taskCount?: number
  /** Current clustering enabled state */
  clusteringEnabled?: boolean
  /** Callback when clustering is toggled */
  onToggle?: (enabled: boolean) => void
  /** Custom className for the container */
  className?: string
  /** Show warning messages for large datasets */
  showWarnings?: boolean
  /** Render without absolute positioning so it can sit inside a flex layout */
  inline?: boolean
}

/**
 * Unified ClusterToggle component for task marker clustering control
 * Provides consistent styling and behavior across all map implementations
 */
export const ClusterToggle = ({
  disabled = false,
  taskCount,
  clusteringEnabled = true,
  onToggle,
  className = '',
  showWarnings = false,
  inline = false,
}: ClusterToggleProps) => {
  const switchId = useId()
  const { t } = useIntl()

  const handleToggle = (checked: boolean) => {
    if (!disabled && onToggle) {
      onToggle(checked)
    }
  }

  const warningMessage = showWarnings
    ? taskCount && taskCount > 5000
      ? t(
          'map.taskMarkers.clusterToggle.tooLargeWarning',
          undefined,
          'Data is too large to cluster, zoom in to view tasks'
        )
      : taskCount && taskCount > 500
        ? t(
            'map.taskMarkers.clusterToggle.enforcedWarning',
            undefined,
            'Clustering is enforced for 500+ tasks'
          )
        : null
    : null

  const enforceDisabled = !!warningMessage || disabled

  const handleLabelClick = (e: React.MouseEvent) => {
    if (!enforceDisabled && onToggle) {
      e.preventDefault()
      handleToggle(!clusteringEnabled)
    }
  }

  return (
    <div
      className={cn(
        inline
          ? 'max-w-none'
          : 'absolute top-3 left-3 z-20 max-w-[calc(100%-6rem)] md:top-4 md:left-4 md:max-w-none',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col justify-center rounded-lg border border-zinc-200 bg-white/95 shadow-sm backdrop-blur-sm md:bg-white dark:border-slate-700 dark:bg-slate-900/95 dark:md:bg-slate-900',
          inline ? 'h-10 px-3' : 'p-2.5 md:p-3'
        )}
      >
        <Label
          htmlFor={switchId}
          onClick={handleLabelClick}
          className={cn(
            'flex items-center gap-1.5 md:gap-2',
            enforceDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          )}
        >
          <Switch
            id={switchId}
            checked={clusteringEnabled}
            onCheckedChange={handleToggle}
            disabled={enforceDisabled}
          />
          <Network className="h-3.5 w-3.5 text-zinc-700 md:h-4 md:w-4 dark:text-zinc-300" />
          <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
            {t('map.taskMarkers.clusterToggle.label', undefined, 'Cluster Markers')}
          </span>
        </Label>

        {((taskCount !== undefined && taskCount > 0) || warningMessage) && (
          <div className="mt-2 space-y-1.5 md:mt-3 md:space-y-2">
            {taskCount !== undefined && taskCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {t(
                  'common.tasksWithCount',
                  { count: taskCount },
                  '{count, plural, one {# task} other {# tasks}}'
                )}
              </Badge>
            )}
            {warningMessage && (
              <p className="text-orange-500 text-xs leading-tight dark:text-orange-400">
                {warningMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
