import { createFileRoute } from '@tanstack/react-router'
import { SuperAdminUsers } from '@/components/Pages/SuperAdminPages/SuperAdminUsers'

export const Route = createFileRoute('/_app/super-admin/users')({
  staticData: { pageTitle: 'All Users' },
  component: SuperAdminUsers,
})
