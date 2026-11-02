import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import { useIntl } from '@/i18n'

export const SuperAdminAnalytics = () => {
  const { t } = useIntl()

  return (
    <div className="mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="font-bold text-2xl text-zinc-900 tracking-tight dark:text-zinc-50">
            {t({ id: 'superAdmin.analytics.title', defaultMessage: 'Platform Analytics' })}
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t({
            id: 'superAdmin.analytics.description',
            defaultMessage: 'View comprehensive analytics and metrics across the platform.',
          })}
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChart3 />
              </EmptyMedia>
              <EmptyTitle>
                {t({
                  id: 'superAdmin.analytics.comingSoonTitle',
                  defaultMessage: 'Analytics dashboard coming soon',
                })}
              </EmptyTitle>
              <EmptyDescription>
                {t({
                  id: 'superAdmin.analytics.comingSoonDescription',
                  defaultMessage:
                    "We're working on bringing you comprehensive platform analytics. Check back soon.",
                })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </div>
  )
}
