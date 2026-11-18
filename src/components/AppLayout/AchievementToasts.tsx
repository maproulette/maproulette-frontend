import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { getAchievement } from '@/types/Achievement'

/**
 * Zero-DOM component that announces newly earned achievements as toasts.
 *
 * Achievements are awarded server-side when a task is fixed (or a challenge is
 * created or completed), and the client only learns about them when the
 * current user's query data is refreshed. So this watches the earned list on
 * the user rather than subscribing to award events directly.
 */
export const AchievementToasts = () => {
  const { user } = useAuthContext()
  const { t } = useIntl()
  const seenRef = useRef<{ userId: number; earned: Set<number> } | null>(null)
  const earnedIds = user?.achievements

  useEffect(() => {
    if (!user) {
      seenRef.current = null
      return
    }

    const earned = new Set(earnedIds ?? [])
    // Seed on first sight of a user so that existing badges are not announced.
    if (seenRef.current?.userId !== user.id) {
      seenRef.current = { userId: user.id, earned }
      return
    }

    const previous = seenRef.current.earned
    seenRef.current = { userId: user.id, earned }

    for (const id of earned) {
      if (previous.has(id)) continue
      const def = getAchievement(id)
      if (!def) continue

      const Icon = def.icon
      toast.success(t(def.title), {
        description: t(def.description),
        icon: <Icon className="size-5 text-mango-500" aria-hidden="true" />,
      })
    }
  }, [user, earnedIds, t])

  return null
}
