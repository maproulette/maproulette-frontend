import { createFileRoute } from '@tanstack/react-router'
import { ManageHome } from '@/components/Pages/ManagementPages/ManageHome'

export const Route = createFileRoute('/_app/manage/')({
  staticData: { pageTitle: 'Create & Manage' },
  component: ManageHome,
})
