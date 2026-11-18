import { Outlet } from '@tanstack/react-router'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { useIntl } from '@/i18n'
import { AuthGuard } from '@/lib/AuthGuard'

export const ManagementLayout = () => {
  const { t } = useIntl()

  return (
    <AuthGuard>
      <div className="flex min-h-0 flex-1 flex-col">
        <SectionHeader
          accentClass="border-l-transparent bg-[linear-gradient(var(--accent-from),var(--accent-to))] bg-size-[4px_100%] bg-origin-border bg-no-repeat"
          basePath="/manage"
          breadcrumbRoot={t({ id: 'common.createManage', defaultMessage: 'create & manage' })}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <Outlet />
        </div>
      </div>
    </AuthGuard>
  )
}
