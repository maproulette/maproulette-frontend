import { Network } from 'lucide-react'
import type React from 'react'
import { useId, useState } from 'react'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

export interface ClusterToggleProps {
  /** Whether the toggle is disabled */
  disabled?: boolean
  /** Current clustering enabled state */
  clusteringEnabled: boolean
  /** Callback when clustering is toggled */
  onToggle?: (enabled: boolean) => void
  /** Custom className for the container */
  className?: string
  /** Render without absolute positioning so it can sit inside a flex layout */
  inline?: boolean
}

const AUTO_CLUSTER_THRESHOLD = 5000

/**
 * Client-side clustering state for a task map. Clustering is enabled by
 * default for large challenges and disabled for small ones, but the user
 * can toggle a control on the map to override this.
 */
export const useClustering = (taskCount: number) => {
  const [override, setOverride] = useState<boolean | null>(null)
  return [override ?? taskCount > AUTO_CLUSTER_THRESHOLD, setOverride] as const
}

/**
 * Unified ClusterToggle component for task marker clustering control
 * Provides consistent styling and behavior across all map implementations
 */
export const ClusterToggle = ({
  disabled = false,
  clusteringEnabled,
  onToggle,
  className = '',
  inline = false,
}: ClusterToggleProps) => {
  const switchId = useId()
  const { t } = useIntl()

  const handleToggle = (checked: boolean) => {
    if (!disabled && onToggle) {
      onToggle(checked)
    }
  }

  const handleLabelClick = (e: React.MouseEvent) => {
    if (!disabled && onToggle) {
      e.preventDefault()
      handleToggle(!clusteringEnabled)
    }
  }

  return (
    <DisabledTooltip
      show={disabled}
      message={t({
        id: 'map.taskMarkers.clusterToggle.forcedTooltip',
        defaultMessage: 'You cannot disable clustering at this zoom level.',
      })}
      side="bottom"
    >
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
            'flex flex-col justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900',
            inline ? 'h-10 px-3' : 'p-2.5 md:p-3'
          )}
        >
          <Label
            htmlFor={switchId}
            onClick={handleLabelClick}
            className={cn(
              'flex items-center gap-1.5 md:gap-2',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            )}
          >
            <Switch
              id={switchId}
              checked={clusteringEnabled}
              onCheckedChange={handleToggle}
              disabled={disabled}
            />
            <Network className="h-3.5 w-3.5 text-zinc-700 md:h-4 md:w-4 dark:text-zinc-300" />
            <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
              {t({ id: 'map.taskMarkers.clusterToggle.label', defaultMessage: 'Cluster Markers' })}
            </span>
          </Label>
        </div>
      </div>
    </DisabledTooltip>
  )
}
