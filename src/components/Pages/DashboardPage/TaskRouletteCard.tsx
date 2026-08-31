import { Flag, ListChecks, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { getDifficultyLabel } from '@/lib/difficultyLevelData'
import { reverseGeocodePlaceName } from '@/lib/reverseGeocode'
import { cn } from '@/lib/utils'
import { PRIORITY_COLOR, PRIORITY_LABEL, type TaskPriorityValue } from '@/types/Priority'
import type { RouletteResult } from './randomTaskPicker'
import type { LandedPocket } from './rouletteWheel'
import { TaskLocationMap } from './TaskLocationMap'

interface Props {
  result: RouletteResult
  pocket: LandedPocket
  /** Off the wheel and centred on the stage. */
  lifted: boolean
  /** Turned over to the info face. */
  flipped: boolean
  liftDuration: number
  flipDuration: number
  starting: boolean
  onStart: () => void
  onClose: () => void
}

/** Scale that makes the full-size card read as a single pocket on the wheel. */
const POCKET_SCALE = 0.11

const formatCoordinates = (latitude: number, longitude: number) =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

export const TaskRouletteCard = ({
  result,
  pocket,
  lifted,
  flipped,
  liftDuration,
  flipDuration,
  starting,
  onStart,
  onClose,
}: Props) => {
  const { t } = useIntl()
  const { task, challenge } = result
  const [longitude, latitude] = task.location?.coordinates ?? []
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const startRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return
    const controller = new AbortController()
    reverseGeocodePlaceName(latitude, longitude, controller.signal).then(setPlaceName)
    return () => controller.abort()
  }, [latitude, longitude])

  // Building the map costs a WebGL context, so hold it back until the flip has finished
  // rather than let it stutter the animation the card exists to show off.
  useEffect(() => {
    if (!flipped) {
      setShowMap(false)
      return
    }
    const timer = window.setTimeout(() => setShowMap(true), flipDuration)
    return () => window.clearTimeout(timer)
  }, [flipped, flipDuration])

  // The spin button that had focus is disabled once a card is up, so hand focus to the
  // card's primary action as it turns over, and let Escape dismiss it.
  useEffect(() => {
    if (flipped) startRef.current?.focus()
  }, [flipped])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const hasLocation = latitude !== undefined && longitude !== undefined
  const priority = (task.priority ?? 1) as TaskPriorityValue
  const tasksRemaining = challenge.completionMetrics?.tasksRemaining

  return (
    <div
      className={cn(
        'absolute z-20 h-[82%] w-[92%] transition-shadow',
        lifted && 'shadow-2xl shadow-black/50'
      )}
      style={{
        left: `${lifted ? 50 : pocket.x}%`,
        top: `${lifted ? 50 : pocket.y}%`,
        transform: `translate(-50%, -50%) scale(${lifted ? 1 : POCKET_SCALE}) rotate(${
          lifted ? 0 : pocket.screenAngle
        }deg)`,
        transition: `left ${liftDuration}ms cubic-bezier(0.33, 1.1, 0.5, 1), top ${liftDuration}ms cubic-bezier(0.33, 1.1, 0.5, 1), transform ${liftDuration}ms cubic-bezier(0.33, 1.1, 0.5, 1), box-shadow ${liftDuration}ms ease-out`,
        perspective: '1400px',
      }}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: `transform ${flipDuration}ms cubic-bezier(0.4, 0.1, 0.3, 1)`,
        }}
      >
        {/* Face down: still just the pocket the ball dropped into */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-amber-300/70 font-bold text-7xl text-white"
          style={{ backfaceVisibility: 'hidden', backgroundColor: pocket.fill }}
        >
          {pocket.value}
        </div>

        {/* Face up: what the spin actually won */}
        <div
          className="absolute inset-0 flex flex-col gap-1.5 overflow-hidden rounded-lg border-2 border-amber-300/70 bg-white p-2.5 text-left dark:bg-slate-900"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex shrink-0 items-center justify-between gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-[11px] text-white"
              style={{ backgroundColor: pocket.fill }}
            >
              {pocket.value}
            </span>
            <span className="truncate text-[11px] text-zinc-400 dark:text-slate-500">
              {t('dashboard.roulette.card.taskId', { id: task.id }, 'Task #{id}')}
            </span>
            <span className="ml-auto truncate rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-[11px] text-zinc-700 dark:bg-slate-800 dark:text-slate-200">
              {getDifficultyLabel(t, challenge.difficulty)}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="shrink-0">
              <p className="line-clamp-2 font-semibold text-[13px] text-zinc-900 leading-snug dark:text-slate-100">
                {challenge.name}
              </p>

              <div className="mt-1.5 flex flex-col gap-0.5 text-[11px] text-zinc-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3 w-3 shrink-0 text-blue-500" aria-hidden="true" />
                  {placeName ??
                    (hasLocation
                      ? formatCoordinates(latitude, longitude)
                      : t(
                          'dashboard.roulette.card.unknownLocation',
                          undefined,
                          'Location unknown'
                        ))}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <Flag className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />
                  {t(
                    'dashboard.roulette.card.priority',
                    { priority: PRIORITY_LABEL[priority] },
                    '{priority} priority'
                  )}
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_COLOR[priority].bg)}
                    aria-hidden="true"
                  />
                </span>
                {tasksRemaining !== undefined && (
                  <span className="flex items-center gap-1.5 truncate">
                    <ListChecks className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />
                    {t(
                      'dashboard.roulette.card.tasksLeft',
                      { count: tasksRemaining.toLocaleString() },
                      '{count} tasks left'
                    )}
                  </span>
                )}
              </div>
            </div>

            {hasLocation &&
              (showMap ? (
                <TaskLocationMap
                  latitude={latitude}
                  longitude={longitude}
                  status={task.status ?? 0}
                  priority={priority}
                  label={t(
                    'dashboard.roulette.card.mapLabel',
                    { location: placeName ?? formatCoordinates(latitude, longitude) },
                    'Map of the task location: {location}'
                  )}
                  className="fade-in min-h-16 flex-1 animate-in duration-300"
                />
              ) : (
                // Placeholder so the layout doesn't jump when the map arrives.
                <div className="min-h-16 flex-1 rounded-md bg-zinc-100 dark:bg-slate-800" />
              ))}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              ref={startRef}
              size="sm"
              className="flex-1"
              onClick={onStart}
              disabled={starting}
            >
              {t('dashboard.roulette.card.startTask', undefined, 'Start Task')}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose} disabled={starting}>
              {t('common.close', undefined, 'Close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
