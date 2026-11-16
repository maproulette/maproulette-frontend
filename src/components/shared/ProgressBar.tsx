import { cn } from '@/lib/utils'

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-blue-500'
  if (percentage >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

export interface ProgressSegment {
  key: string
  percentage: number
  color: string
  title?: string
  opacity?: number
}

interface ProgressBarProps {
  percentage?: number
  segments?: ProgressSegment[]
  className?: string
}

export const ProgressBar = ({ percentage, segments, className }: ProgressBarProps) => {
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-slate-500',
        className
      )}
    >
      {segments && segments.length > 0 ? (
        <div className="flex h-full w-full">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className="h-full transition-all duration-300"
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
                opacity: segment.opacity ?? 1,
              }}
              title={segment.title}
            />
          ))}
        </div>
      ) : percentage !== undefined ? (
        <div
          className={cn('h-full transition-all duration-300', getProgressBarColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      ) : null}
    </div>
  )
}
