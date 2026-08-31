import { Puzzle } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import { useIntl } from '@/i18n'

export const SuperAdminPlugins = () => {
  const { t } = useIntl()

  return (
    <div className="mx-auto px-4">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Puzzle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
            {t('superAdminPlugins.title', undefined, 'Plugin Management')}
          </h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t(
            'superAdminPlugins.subtitle',
            undefined,
            'Manage plugins and integrations for the platform'
          )}
        </p>
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Puzzle />
          </EmptyMedia>
          <EmptyTitle>
            {t('superAdminPlugins.comingSoon.title', undefined, 'Coming soon')}
          </EmptyTitle>
          <EmptyDescription>
            {t(
              'superAdminPlugins.comingSoon.description',
              undefined,
              'Plugin management is not yet available. There is currently no plugins API to install, configure, or browse plugins against, so this page is a placeholder until that support lands.'
            )}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
