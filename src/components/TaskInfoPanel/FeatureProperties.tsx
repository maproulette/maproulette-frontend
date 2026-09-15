import { ChevronDown, Crosshair, Eye, EyeOff } from 'lucide-react'
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { useOptionalTaskFeatureContext } from '@/components/Pages/TaskEditPage/contexts/TaskFeatureContext'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useIntl } from '@/i18n'
import { resolveFeatureStyle } from '@/lib/taskFeatureStyle'
import { cn } from '@/lib/utils'
import type { TaskFeatureGroup } from './taskUtils/geometryUtils'

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g

/** Split a value string on URLs and render each URL as an anchor. */
const renderValueWithLinks = (text: string): ReactNode => {
  const parts = text.split(URL_REGEX)
  let offset = 0
  return parts.map((part, i) => {
    // String.split with a capture group puts captures at odd indices. The key uses the
    // cumulative character offset (content-derived, unique even for repeated URLs) rather
    // than the array index.
    const start = offset
    offset += part.length
    if (i % 2 === 1) {
      return (
        <a
          key={start}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

// Approximate per-char widths at text-xs (~12px line-height). The key uses the
// default sans font; the value uses font-mono. These are used to decide whether
// a row's value fits inline next to its key in the current container width.
const KEY_CHAR_WIDTH = 6.5
const VALUE_CHAR_WIDTH = 7.2
// Row padding (px-2 each side) + gap between key and value (gap-2).
const ROW_HORIZONTAL_OVERHEAD = 24

/** Measures the width the property rows have to lay themselves out in. */
export const useMeasuredWidth = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { containerRef, containerWidth }
}

export const PropertyRows = ({
  properties,
  containerWidth,
}: {
  properties: Record<string, unknown>
  containerWidth: number | null
}) => (
  <div className="space-y-1">
    {Object.entries(properties).map(([key, value]) => {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
      let isLong = valueStr.includes('\n')
      if (!isLong && containerWidth !== null) {
        const availableForValue =
          containerWidth - ROW_HORIZONTAL_OVERHEAD - key.length * KEY_CHAR_WIDTH
        const estimatedValueWidth = valueStr.length * VALUE_CHAR_WIDTH
        isLong = estimatedValueWidth > availableForValue
      }

      return (
        <div
          key={key}
          className={cn(
            'rounded bg-zinc-100 px-2 py-1.5 text-xs dark:bg-slate-800/50',
            isLong ? 'space-y-1' : 'flex items-start justify-between gap-2'
          )}
        >
          <span
            className={cn('font-medium text-zinc-500 dark:text-slate-400', !isLong && 'shrink-0')}
          >
            {key}
          </span>
          <span
            className={cn(
              'block whitespace-pre-wrap break-words font-mono text-zinc-900 [overflow-wrap:anywhere] dark:text-white',
              isLong ? 'w-full text-left' : 'min-w-0 text-right'
            )}
          >
            {renderValueWithLinks(valueStr)}
          </span>
        </div>
      )
    })}
  </div>
)

interface FeaturePropertiesProps {
  group: TaskFeatureGroup
  /** Hidden when the task has a single feature — there is nothing to isolate. */
  showFocusToggle: boolean
  containerWidth: number | null
}

/**
 * The color the map draws this feature in, where its data asked for one, so a
 * row in the list can be matched to a line on the map at a glance.
 */
const FeatureSwatch = ({ group }: { group: TaskFeatureGroup }) => {
  const style = resolveFeatureStyle(group.feature)
  const color = style.stroke ?? style.markerColor ?? style.fill
  if (!color) return null

  return (
    <span
      className="h-3 w-3 shrink-0 rounded-full border border-zinc-300 dark:border-slate-600"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  )
}

/**
 * One feature of a task, with the controls that tie it to the map: zoom to
 * just this feature, or show it on its own. Hovering the block emphasizes the
 * matching geometry so it's clear which of the task's features this is. The
 * map controls are dropped where there is no task map to drive (a task drawer
 * on a browse page).
 */
export const FeatureProperties = ({
  group,
  showFocusToggle,
  containerWidth,
}: FeaturePropertiesProps) => {
  const { t } = useIntl()
  const featureContext = useOptionalTaskFeatureContext()
  const [open, setOpen] = useState(false)
  const isFocused = featureContext?.focusedFeatureKey === group.key
  const propertyCount = Object.keys(group.properties).length

  const label =
    group.name ??
    t('taskInfoPanel.properties.featureLabel', { number: group.index + 1 }, 'Feature {number}')

  const highlight = (featureKey: string | null) =>
    featureContext?.setHighlightedFeatureKey(featureKey)

  const focusLabel = isFocused
    ? t(
        'taskInfoPanel.properties.showAllFeatures',
        undefined,
        "Show the task's other features again"
      )
    : t('taskInfoPanel.properties.focusFeature', undefined, 'Show only this feature on the map')
  const zoomLabel = t('taskInfoPanel.properties.zoomToFeature', undefined, 'Zoom to this feature')

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        'rounded-lg border border-zinc-200 dark:border-slate-700',
        isFocused && 'border-amber-500 dark:border-amber-500'
      )}
      aria-label={label}
      onMouseEnter={() => highlight(group.key)}
      onMouseLeave={() => highlight(null)}
      // Keyboard users tabbing into the feature's controls get the same
      // emphasis on the map that hovering gives.
      onFocus={() => highlight(group.key)}
      onBlur={() => highlight(null)}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <FeatureSwatch group={group} />
          <span className="min-w-0 truncate font-medium text-xs text-zinc-900 dark:text-white">
            {label}
          </span>
          {group.geometryType && (
            <span className="shrink-0 text-[10px] text-zinc-500 uppercase dark:text-slate-400">
              {group.geometryType}
            </span>
          )}
          <span className="shrink-0 text-[10px] text-zinc-400 dark:text-slate-500">
            {t(
              'taskInfoPanel.properties.propertyCount',
              { count: propertyCount },
              '{count} properties'
            )}
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform',
              open && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        {featureContext && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => featureContext.zoomToFeature(group.feature)}
              title={zoomLabel}
              aria-label={zoomLabel}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Crosshair className="h-3.5 w-3.5" />
            </button>
            {showFocusToggle && (
              <button
                type="button"
                onClick={() => featureContext.focusFeature(group.key)}
                title={focusLabel}
                aria-label={focusLabel}
                aria-pressed={isFocused}
                className={cn(
                  'rounded p-1 transition-colors',
                  isFocused
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                )}
              >
                {isFocused ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="border-zinc-200 border-t px-2 py-2 dark:border-slate-700">
          {propertyCount === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              {t(
                'taskInfoPanel.properties.featureEmpty',
                undefined,
                'No properties on this feature.'
              )}
            </p>
          ) : (
            <PropertyRows properties={group.properties} containerWidth={containerWidth} />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
