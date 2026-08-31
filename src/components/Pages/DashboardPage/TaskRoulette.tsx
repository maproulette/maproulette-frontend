import { useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { getDifficultyLabel } from '@/lib/difficultyLevelData'
import { logger } from '@/lib/logger'
import {
  fetchRandomTaskByDifficulty,
  ROULETTE_DIFFICULTIES,
  type RouletteDifficulty,
  type RouletteResult,
} from './randomTaskPicker'
import {
  BALL_RADIUS,
  BALL_REST_RADIUS,
  CENTER,
  type LandedPocket,
  landedPocket,
  NUMBER_RADIUS,
  POCKET_INNER_RADIUS,
  POCKETS,
  spokes,
} from './rouletteWheel'
import { TaskRouletteCard } from './TaskRouletteCard'

const SPIN_DURATION = 6500
/** Turns of the wheel, and of the ball the other way, per spin. */
const WHEEL_TURNS = 9
const BALL_TURNS = 17
/** Fraction of the spin the ball rides the apron before dropping into the pockets. */
const BALL_DROP_AT = 0.62
const BALL_DROP_DURATION = 1600
/** Pocket lifting off the wheel and flying to the middle, then turning over. */
const LIFT_DURATION = 1000
const FLIP_DURATION = 800

/** Selected difficulty wears its own colour: green easy, amber normal, orange expert. */
const SELECTED_VARIANT = {
  1: 'success',
  2: 'warning',
  3: 'caution',
} as const

const RIM_SPOKES = spokes(8, POCKET_INNER_RADIUS + 15, 49.5)
const CONE_SPOKES = spokes(8, 11, POCKET_INNER_RADIUS)

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Quick ramp, then a long slow crawl to the finish - the drama is all in the tail.
const spinTransition = `transform ${SPIN_DURATION}ms cubic-bezier(0.05, 0.72, 0.06, 1)`
const ballDropTransition = `transform ${BALL_DROP_DURATION}ms cubic-bezier(0.45, 0, 0.55, 1)`

export const TaskRoulette = () => {
  const { t } = useIntl()
  const queryClient = useQueryClient()
  // Gradients are referenced by id across the three stacked layers, so they have to be
  // unique per instance; useId's punctuation is stripped to keep url(#...) refs simple.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rimGradient = `roulette-rim-${uid}`
  const coneGradient = `roulette-cone-${uid}`
  const goldGradient = `roulette-gold-${uid}`
  const navigateToTask = useNavigateToTask()
  const [difficulty, setDifficulty] = useState<RouletteDifficulty>(2)
  const [spinning, setSpinning] = useState(false)
  const [wheelAngle, setWheelAngle] = useState(0)
  const [ballAngle, setBallAngle] = useState(0)
  const [ballDropped, setBallDropped] = useState(false)
  const [reveal, setReveal] = useState<{
    result: RouletteResult
    pocket: LandedPocket
    lifted: boolean
    flipped: boolean
  } | null>(null)
  const [starting, setStarting] = useState(false)
  const [animated, setAnimated] = useState(true)

  const handleSpin = async () => {
    if (spinning || reveal) return
    const animate = !prefersReducedMotion()
    setAnimated(animate)

    setSpinning(true)
    setBallDropped(false)

    // Wheel and ball counter-rotate onto their own random landing angles; both are needed
    // afterwards to work out which pocket ended up under the ball.
    const nextWheelAngle = animate
      ? wheelAngle + 360 * WHEEL_TURNS + Math.random() * 360
      : wheelAngle
    const nextBallAngle = animate ? ballAngle - 360 * BALL_TURNS - Math.random() * 360 : ballAngle
    setWheelAngle(nextWheelAngle)
    setBallAngle(nextBallAngle)

    // Settle the fetch into a value either way, so a rejection while the wheel is
    // still turning isn't reported as an unhandled rejection.
    const settled = fetchRandomTaskByDifficulty(difficulty, queryClient).then(
      (picked) => ({ picked }),
      (error: unknown) => ({ error })
    )

    if (animate) {
      // Let the ball fall out of the apron and into the numbers on the way down.
      await wait(SPIN_DURATION * BALL_DROP_AT)
      setBallDropped(true)
      await wait(SPIN_DURATION * (1 - BALL_DROP_AT))
    }
    const outcome = await settled

    try {
      if ('error' in outcome) throw outcome.error

      if (!outcome.picked) {
        toast.error(
          t(
            'dashboard.roulette.noTasks',
            { difficulty: getDifficultyLabel(t, difficulty) },
            'No available {difficulty} tasks right now - try another difficulty'
          )
        )
        return
      }

      // The winning pocket lifts off the wheel, flies to the middle and turns over.
      setReveal({
        result: outcome.picked,
        pocket: landedPocket(nextWheelAngle, nextBallAngle),
        lifted: false,
        flipped: false,
      })
      await wait(animate ? 60 : 0)
      setReveal((current) => (current ? { ...current, lifted: true } : current))
      await wait(animate ? LIFT_DURATION : 0)
      setReveal((current) => (current ? { ...current, flipped: true } : current))
    } catch (error) {
      logger.error('Task roulette failed to load a random task', { error, difficulty })
      toast.error(t('dashboard.roulette.failed', undefined, 'Failed to load a random task'))
    } finally {
      setSpinning(false)
    }
  }

  const handleStart = async () => {
    if (!reveal) return
    setStarting(true)
    try {
      await navigateToTask(reveal.result.task.id)
    } catch (error) {
      logger.error('Task roulette failed to open the task', { error })
      toast.error(t('dashboard.roulette.failed', undefined, 'Failed to load a random task'))
      setStarting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-3 p-4">
      <fieldset
        aria-label={t('dashboard.roulette.difficultyLabel', undefined, 'Task difficulty')}
        className="flex shrink-0 gap-2"
      >
        {ROULETTE_DIFFICULTIES.map((level) => (
          <Button
            key={level}
            type="button"
            size="sm"
            variant={difficulty === level ? SELECTED_VARIANT[level] : 'outline'}
            aria-pressed={difficulty === level}
            disabled={spinning}
            onClick={() => setDifficulty(level)}
          >
            {getDifficultyLabel(t, level)}
          </Button>
        ))}
      </fieldset>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="relative aspect-square max-h-full w-full max-w-full">
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || reveal !== null}
            aria-label={t('dashboard.roulette.ariaLabel', undefined, 'Spin for a random task')}
            className="absolute inset-0 cursor-pointer disabled:cursor-default"
          >
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
              style={{
                transform: `rotate(${wheelAngle}deg)`,
                transition: spinning ? spinTransition : undefined,
              }}
            >
              <defs>
                <radialGradient id={rimGradient} cx="42%" cy="34%" r="72%">
                  <stop offset="0%" stopColor="#a5713f" />
                  <stop offset="60%" stopColor="#7a4a24" />
                  <stop offset="100%" stopColor="#40230f" />
                </radialGradient>
                <radialGradient id={coneGradient} cx="40%" cy="32%" r="70%">
                  <stop offset="0%" stopColor="#93552b" />
                  <stop offset="70%" stopColor="#6b3a1c" />
                  <stop offset="100%" stopColor="#4a2611" />
                </radialGradient>
                <linearGradient id={goldGradient} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f7e08a" />
                  <stop offset="45%" stopColor="#d9a93c" />
                  <stop offset="100%" stopColor="#8a6115" />
                </linearGradient>
              </defs>

              {/* Wooden apron, seamed like the real thing */}
              <circle cx={CENTER} cy={CENTER} r="49.5" fill={`url(#${rimGradient})`} />
              {RIM_SPOKES.map((spoke) => (
                <line
                  key={spoke.key}
                  x1={spoke.x1}
                  y1={spoke.y1}
                  x2={spoke.x2}
                  y2={spoke.y2}
                  stroke="#2e1809"
                  strokeOpacity="0.45"
                  strokeWidth="0.5"
                />
              ))}
              <circle
                cx={CENTER}
                cy={CENTER}
                r="49.5"
                fill="none"
                stroke="#2e1809"
                strokeOpacity="0.5"
                strokeWidth="1"
              />

              {/* Gold band framing the numbers */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r="45.4"
                fill="none"
                stroke={`url(#${goldGradient})`}
                strokeWidth="2"
              />

              {POCKETS.map((pocket) => (
                <path
                  key={pocket.value}
                  d={pocket.path}
                  fill={pocket.fill}
                  stroke={`url(#${goldGradient})`}
                  strokeWidth="0.35"
                />
              ))}
              {POCKETS.map((pocket) => (
                <text
                  key={pocket.value}
                  transform={`rotate(${pocket.rotation} ${CENTER} ${CENTER})`}
                  x={CENTER}
                  y={CENTER - NUMBER_RADIUS}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize="3.6"
                  fontWeight="700"
                >
                  {pocket.value}
                </text>
              ))}

              {/* Inner cone */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={POCKET_INNER_RADIUS}
                fill={`url(#${coneGradient})`}
                stroke={`url(#${goldGradient})`}
                strokeWidth="1.6"
              />
              {CONE_SPOKES.map((spoke) => (
                <line
                  key={spoke.key}
                  x1={spoke.x1}
                  y1={spoke.y1}
                  x2={spoke.x2}
                  y2={spoke.y2}
                  stroke="#2e1809"
                  strokeOpacity="0.3"
                  strokeWidth="0.4"
                />
              ))}
            </svg>

            {/* Ball, riding the apron against the wheel's rotation */}
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
              style={{
                transform: `rotate(${ballAngle}deg)`,
                transition: spinning ? spinTransition : undefined,
              }}
            >
              <g
                style={{
                  transform: `translateY(${ballDropped ? BALL_RADIUS - BALL_REST_RADIUS : 0}px)`,
                  transition: ballDropTransition,
                }}
              >
                <circle cx={CENTER} cy={CENTER - BALL_RADIUS} r="2" fill="#f8fafc" />
                <circle
                  cx={CENTER}
                  cy={CENTER - BALL_RADIUS}
                  r="2"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="0.3"
                />
              </g>
            </svg>

            {/* Hub: the spin control itself */}
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
            >
              <circle cx={CENTER} cy={CENTER} r="12" fill={`url(#${goldGradient})`} />
              <circle
                cx={CENTER}
                cy={CENTER}
                r="9.4"
                fill="#3f2110"
                stroke={`url(#${goldGradient})`}
                strokeWidth="0.8"
              />
              <text
                x={CENTER}
                y={CENTER}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#f7e08a"
                fontSize="4.4"
                fontWeight="700"
                letterSpacing="0.5"
                opacity={spinning ? 0.55 : 1}
              >
                {t('dashboard.roulette.spin', undefined, 'SPIN')}
              </text>
            </svg>
          </button>

          {reveal && (
            <TaskRouletteCard
              result={reveal.result}
              pocket={reveal.pocket}
              lifted={reveal.lifted}
              flipped={reveal.flipped}
              liftDuration={animated ? LIFT_DURATION : 0}
              flipDuration={animated ? FLIP_DURATION : 0}
              starting={starting}
              onStart={handleStart}
              onClose={() => {
                setReveal(null)
                setStarting(false)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
