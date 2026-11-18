import { cn } from '@/lib/utils'

export interface ProgressSegment {
  key: string
  percentage: number
  color: string
  title?: string
}

interface ProgressBarProps {
  percentage?: number
  segments?: ProgressSegment[]
  className?: string
}

export const ProgressBar = ({ percentage, segments, className }: ProgressBarProps) => {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted-strong', className)}>
      {segments && segments.length > 0 ? (
        <div className="flex h-full w-full">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className="h-full transition-all duration-300"
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
              }}
              title={segment.title}
            />
          ))}
        </div>
      ) : percentage !== undefined ? (
        <div
          className="bg-(image:--accent-gradient) h-full transition-all duration-300"
          style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }}
        />
      ) : null}
    </div>
  )
}
