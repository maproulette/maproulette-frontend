import { FolderKanban } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import { useIntl } from '@/i18n'

export const SuperAdminProjects = () => {
  const { t } = useIntl()

  return (
    <div className="mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <FolderKanban className="h-8 w-8 text-green-600 dark:text-green-400" />
          <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
            {t({ id: 'superAdminProjects.title', defaultMessage: 'All Projects' })}
          </h1>
          <Badge variant="secondary">
            {t({ id: 'superAdminProjects.comingSoonBadge', defaultMessage: 'Coming Soon' })}
          </Badge>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t({
            id: 'common.viewManageProjectsSubtitle',
            defaultMessage: 'View and manage all projects across the platform',
          })}
        </p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderKanban />
          </EmptyMedia>
          <EmptyTitle>
            {t({
              id: 'superAdminProjects.comingSoon.title',
              defaultMessage: 'Project management coming soon',
            })}
          </EmptyTitle>
          <EmptyDescription>
            {t({
              id: 'superAdminProjects.comingSoon.description',
              defaultMessage:
                "We're building out project management tools for super admins. Check back soon.",
            })}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
