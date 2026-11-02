import { CheckCircle2, Lock, Trophy } from 'lucide-react'
import {
  getAllLevelMilestones,
  getScoreForLevel,
  type LevelInfo,
} from '@/components/Pages/DashboardPage/levelUtils'
import { Badge } from '@/components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Progress } from '@/components/ui/Progress'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

interface LevelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLevel: number
  currentScore: number
}

export const LevelModal = ({ open, onOpenChange, currentLevel, currentScore }: LevelModalProps) => {
  const { t, formatNumber } = useIntl()
  const milestones = getAllLevelMilestones()

  // Calculate progress to next level using actual level thresholds
  const currentLevelScore = getScoreForLevel(currentLevel)
  const nextLevelScore = getScoreForLevel(currentLevel + 1)
  const pointsIntoLevel = currentScore - currentLevelScore
  const pointsNeededForLevel = nextLevelScore - currentLevelScore
  const progressToNext = Math.min(100, (pointsIntoLevel / pointsNeededForLevel) * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="border-zinc-200 border-b bg-zinc-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-semibold text-base">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Trophy className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              {t({ id: 'dashboard.levelModal.title', defaultMessage: 'Mapper Level System' })}
            </DialogTitle>
            <DialogDescription>
              {t({
                id: 'dashboard.levelModal.description',
                defaultMessage: 'Complete challenges to earn points and level up your mapper rank.',
              })}
            </DialogDescription>
          </DialogHeader>

          {/* Current Progress Card */}
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-none">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-zinc-900 dark:text-white">
                {t(
                  { id: 'common.level', defaultMessage: 'Level {level}' },
                  { level: currentLevel }
                )}
              </span>
              <span className="text-sm text-zinc-500 dark:text-slate-400">
                {t(
                  {
                    id: 'dashboard.levelModal.totalPoints',
                    defaultMessage: '{points, plural, one {# total point} other {# total points}}',
                  },
                  { points: currentScore }
                )}
              </span>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-slate-400">
                {t(
                  {
                    id: 'dashboard.levelModal.progressToLevel',
                    defaultMessage: 'Progress to Level {level}',
                  },
                  { level: currentLevel + 1 }
                )}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {formatNumber(pointsIntoLevel)} / {formatNumber(pointsNeededForLevel)}
              </span>
            </div>
            <Progress value={progressToNext} className="h-3" />
            <p className="mt-2 text-center text-xs text-zinc-500 dark:text-slate-400">
              {t(
                {
                  id: 'dashboard.levelModal.pointsToNextLevel',
                  defaultMessage:
                    '{points, plural, one {# more point} other {# more points}} to next level',
                },
                { points: pointsNeededForLevel - pointsIntoLevel }
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2 p-6">
          {milestones.map((milestone: LevelInfo) => {
            const isUnlocked = currentLevel >= milestone.level
            const isCurrent = currentLevel === milestone.level

            return (
              <div
                key={milestone.level}
                className={cn(
                  'relative overflow-hidden rounded-xl bg-white shadow-sm transition-all dark:bg-slate-800 dark:shadow-none',
                  isCurrent && 'bg-blue-50/60 ring-2 ring-blue-500 dark:bg-blue-950/30',
                  !isUnlocked && 'bg-zinc-50 dark:bg-slate-900/50'
                )}
              >
                {/* Lock Overlay for locked levels */}
                {!isUnlocked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-900/70">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-slate-800">
                        <Lock className="size-5 text-zinc-500 dark:text-slate-400" />
                      </div>
                      <span className="font-semibold text-sm text-zinc-600 dark:text-slate-300">
                        {t(
                          {
                            id: 'dashboard.levelModal.pointsToUnlock',
                            defaultMessage:
                              '{points, plural, one {# point} other {# points}} to unlock',
                          },
                          { points: milestone.requiredScore - currentScore }
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4">
                  {/* Level Badge */}
                  <div
                    className={cn(
                      'relative z-20 flex size-14 shrink-0 items-center justify-center rounded-full font-bold text-base',
                      isCurrent
                        ? 'bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                        : isUnlocked
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-200 text-zinc-500 dark:bg-slate-700 dark:text-slate-400'
                    )}
                  >
                    {milestone.level}
                    {isCurrent && (
                      <span className="-top-1 -right-1 absolute flex size-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex size-4 rounded-full bg-blue-500" />
                      </span>
                    )}
                  </div>

                  {/* Level Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={cn(
                          'font-semibold text-base',
                          isUnlocked
                            ? 'text-zinc-900 dark:text-white'
                            : 'text-zinc-500 dark:text-slate-400'
                        )}
                      >
                        {milestone.emoji} {milestone.title}
                      </h3>
                      {isCurrent && (
                        <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                          {t({ id: 'common.current', defaultMessage: 'Current' })}
                        </Badge>
                      )}
                      {isUnlocked && !isCurrent && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-slate-400">
                      {t(
                        {
                          id: 'dashboard.levelModal.pointsRequired',
                          defaultMessage:
                            '{points, plural, one {# point} other {# points}} required',
                        },
                        { points: milestone.requiredScore }
                      )}
                    </p>
                    {isCurrent && (
                      <p className="mt-1 font-semibold text-blue-600 text-sm dark:text-blue-400">
                        {t(
                          {
                            id: 'dashboard.levelModal.yourScore',
                            defaultMessage:
                              'Your score: {points, plural, one {# point} other {# points}}',
                          },
                          { points: currentScore }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Formula Card */}
        <div className="mx-6 mb-6 rounded-xl bg-zinc-50 p-4 dark:bg-slate-900/50">
          <h4 className="mb-2 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
            <Trophy className="size-4 text-amber-600 dark:text-amber-400" />
            {t({
              id: 'dashboard.levelModal.howItWorksTitle',
              defaultMessage: 'How leveling works',
            })}
          </h4>
          <p className="text-sm text-zinc-600 dark:text-slate-300">
            {t({
              id: 'dashboard.levelModal.calculatedUsing',
              defaultMessage: 'Your level is calculated using:',
            })}{' '}
            <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              Level = √(Points / 10)
            </code>
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-slate-400">
            {t({
              id: 'dashboard.levelModal.howItWorksFooter',
              defaultMessage:
                'Each level requires exponentially more points. Keep mapping to climb the ranks.',
            })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
