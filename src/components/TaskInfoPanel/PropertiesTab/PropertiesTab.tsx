import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { parseFirstFeatureProperties } from '../taskUtils/geometryUtils'

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

export const PropertiesTab = () => {
  const { t } = useIntl()
  const { task } = useTaskContext()
  const properties = parseFirstFeatureProperties(task)
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

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-slate-400">
        {t('taskInfoPanel.properties.empty', undefined, 'No properties available for this task.')}
      </p>
    )
  }

  return (
    <div ref={containerRef} className="space-y-1">
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
}
