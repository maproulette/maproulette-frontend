import { createFileRoute } from '@tanstack/react-router'
import { SuperAdminHome } from '@/components/Pages/SuperAdminPages/SuperAdminHome'

export const Route = createFileRoute('/_app/super-admin/')({
  staticData: { pageTitle: 'Super Admin' },
  component: SuperAdminHome,
})
