import { ListChecks } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import { useIntl } from '@/i18n'

export const SuperAdminChallenges = () => {
  const { t } = useIntl()

  return (
    <div className="mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <ListChecks className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
            {t('common.allChallenges', undefined, 'All Challenges')}
          </h1>
          <Badge variant="secondary">
            {t('superAdminChallenges.comingSoonBadge', undefined, 'Coming Soon')}
          </Badge>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t(
            'superAdminChallenges.subtitle',
            undefined,
            'Browse and manage all challenges across the platform'
          )}
        </p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListChecks />
          </EmptyMedia>
          <EmptyTitle>
            {t(
              'superAdminChallenges.comingSoon.title',
              undefined,
              'Challenge management coming soon'
            )}
          </EmptyTitle>
          <EmptyDescription>
            {t(
              'superAdminChallenges.comingSoon.description',
              undefined,
              "We're building out challenge management tools for super admins. Check back soon."
            )}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
