import { useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { useCongratulate } from '@/contexts/CongratulateContext'
import { AchievementEarnedContent } from './variants/AchievementEarned'
import { ChallengeCompletedContent } from './variants/ChallengeCompleted'
import { LevelUpContent } from './variants/LevelUp'
import { StreakMilestoneContent } from './variants/StreakMilestone'

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export const CongratulateModal = () => {
  const { current, dismiss } = useCongratulate()

  useEffect(() => {
    if (!current) return
    const timer = window.setTimeout(dismiss, 8000)
    return () => window.clearTimeout(timer)
  }, [current, dismiss])

  if (!current) return null

  const variant = current.variant

  return (
    <Dialog open={!!current} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent aria-live="polite" className="gap-6">
        {!prefersReducedMotion() && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex justify-around overflow-hidden"
          >
            {/* simple confetti-ish gradient pulse — no external dep */}
            <span className="size-2 animate-bounce rounded-full bg-amber-400" />
            <span className="size-2 animate-bounce rounded-full bg-emerald-400 delay-75" />
            <span className="size-2 animate-bounce rounded-full bg-blue-400 delay-150" />
            <span className="size-2 animate-bounce rounded-full bg-purple-400 delay-300" />
          </div>
        )}
        {variant.kind === 'levelUp' && (
          <LevelUpContent level={variant.level} score={variant.score} />
        )}
        {variant.kind === 'achievement' && (
          <AchievementEarnedContent achievementId={variant.achievementId} />
        )}
        {variant.kind === 'streak' && <StreakMilestoneContent count={variant.count} />}
        {variant.kind === 'challengeCompleted' && (
          <ChallengeCompletedContent challengeName={variant.challengeName} onDismiss={dismiss} />
        )}
      </DialogContent>
    </Dialog>
  )
}
