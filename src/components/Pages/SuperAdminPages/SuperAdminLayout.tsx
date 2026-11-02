import { Outlet } from '@tanstack/react-router'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { useIntl } from '@/i18n'
import { SuperAdminGuard } from '@/lib/SuperAdminGuard'

export const SuperAdminLayout = () => {
  const { t } = useIntl()
  return (
    <SuperAdminGuard>
      <div className="flex h-full flex-col">
        <SectionHeader
          accentClass="border-l-purple-500"
          basePath="/super-admin"
          breadcrumbRoot={t({ id: 'superAdmin.layout.breadcrumbRoot', defaultMessage: 'super admin' })}
        />
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </div>
    </SuperAdminGuard>
  )
}
