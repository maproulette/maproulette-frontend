import { useId } from 'react'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { useIntl } from '@/i18n'
import {
  type AchievementCategory,
  achievementCategoryLabel,
  achievementDefinitions,
} from '@/types/Achievement'

interface Props {
  earnedIds: number[]
}

export const AchievementsSection = ({ earnedIds }: Props) => {
  const { t } = useIntl()
  const headingId = useId()
  const earnedSet = new Set(earnedIds)
  const grouped = achievementDefinitions.reduce(
    (acc, def) => {
      acc[def.category] ??= []
      acc[def.category].push(def)
      return acc
    },
    {} as Record<AchievementCategory, typeof achievementDefinitions>
  )

  const earnedCount = earnedIds.length
  const totalCount = achievementDefinitions.length

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="font-semibold text-lg text-zinc-900 dark:text-slate-100">
          {t({ id: 'profilePage.achievements.title', defaultMessage: 'Achievements' })}
        </h2>
        <span className="text-sm text-zinc-500 dark:text-slate-400">
          {t({ id: 'profilePage.achievements.earnedCount', defaultMessage: '{earned, number} of {total, number} earned' }, { earned: earnedCount, total: totalCount }
          )}
        </span>
      </div>
      <div className="space-y-6">
        {(Object.keys(grouped) as AchievementCategory[]).map((category) => (
          <div key={category} className="space-y-2">
            <h3 className="font-medium text-sm text-zinc-600 uppercase tracking-wide dark:text-slate-400">
              {achievementCategoryLabel[category]}
            </h3>
            <div className="flex flex-wrap gap-3">
              {grouped[category].map((def) => (
                <AchievementBadge
                  key={def.id}
                  achievement={def}
                  size="md"
                  locked={!earnedSet.has(def.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
