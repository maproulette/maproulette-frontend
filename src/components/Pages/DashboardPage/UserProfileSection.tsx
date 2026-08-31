import { Shield, Sparkles } from 'lucide-react'
import { useState } from 'react'
import {
  calculateLevel,
  calculateNextLevelProgress,
  getLevelInfo,
  getScoreForLevel,
} from '@/components/Pages/DashboardPage/levelUtils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useIntl } from '@/i18n'
import { initials as getInitials } from '@/lib/utils'
import type { User } from '@/types/User'
import { LevelModal } from './LevelModal'
import { TaskRoulette } from './TaskRoulette'

/**
 * The random-task roulette is finished but not ready to ship - flip this to true
 * to put it back on the profile card.
 */
const SHOW_TASK_ROULETTE = false

interface UserProfileSectionProps {
  user: User
}

export const UserProfileSection = ({ user }: UserProfileSectionProps) => {
  const { t } = useIntl()
  const [levelModalOpen, setLevelModalOpen] = useState(false)

  const userLevel = calculateLevel(user.score || 0)
  const levelProgress = calculateNextLevelProgress(user.score || 0)
  const currentLevelScore = getScoreForLevel(userLevel)
  const nextLevelScore = getScoreForLevel(userLevel + 1)
  const pointsIntoLevel = (user.score || 0) - currentLevelScore
  const pointsNeededForLevel = nextLevelScore - currentLevelScore
  const { title: levelTitle, emoji: levelEmoji } = getLevelInfo(userLevel)

  return (
    <>
      <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-3 border-zinc-200 border-b p-6 dark:border-slate-700/50">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-blue-500/50">
              <AvatarImage
                src={user.osmProfile.avatarURL || ''}
                alt={user.osmProfile.displayName}
              />
              <AvatarFallback className="bg-zinc-200 font-bold text-base dark:bg-slate-700">
                {getInitials(user.osmProfile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="-bottom-1 -right-1 absolute flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 font-bold text-sm text-white ring-2 ring-white dark:ring-slate-800">
              {userLevel}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="font-semibold text-base text-zinc-900 dark:text-white">
                {user.osmProfile.displayName}
              </h1>
              {!user.guest && (
                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30">
                  <Shield className="mr-1 h-3 w-3" />
                  {t('dashboard.profile.verified', undefined, 'Verified')}
                </Badge>
              )}
              {user.guest && (
                <Badge className="bg-yellow-500/20 text-xs text-yellow-400 hover:bg-yellow-500/30">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {t('dashboard.profile.guest', undefined, 'Guest')}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLevelModalOpen(true)}
              className="mt-1 text-blue-400 text-sm transition-colors hover:text-blue-300"
            >
              {levelEmoji} {levelTitle}
            </button>
          </div>
        </div>

        {/* Level Progress */}
        <button
          type="button"
          onClick={() => setLevelModalOpen(true)}
          className="cursor-pointer px-6 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-slate-700/50"
        >
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-700 dark:text-slate-300">
              {t('common.level', { level: userLevel }, 'Level {level}')}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {t(
                'dashboard.profile.progressToNext',
                {
                  current: pointsIntoLevel.toLocaleString(),
                  total: pointsNeededForLevel.toLocaleString(),
                },
                '{current} / {total} to next level'
              )}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </button>

        {/* Random-task roulette - hidden until we're ready to launch it */}
        {SHOW_TASK_ROULETTE && <TaskRoulette />}
      </div>

      <LevelModal
        open={levelModalOpen}
        onOpenChange={setLevelModalOpen}
        currentLevel={userLevel}
        currentScore={user.score || 0}
      />
    </>
  )
}
