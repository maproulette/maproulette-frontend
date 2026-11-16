import { createFileRoute } from '@tanstack/react-router'
import { SuperAdminLayout } from '@/components/Pages/SuperAdminPages/SuperAdminLayout'

export const Route = createFileRoute('/_app/super-admin')({
  component: SuperAdminLayout,
})
