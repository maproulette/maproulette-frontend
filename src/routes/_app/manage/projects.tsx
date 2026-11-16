import { createFileRoute } from '@tanstack/react-router'
import { ManageProjects } from '@/components/Pages/ManagementPages/ManageProjects'

export const Route = createFileRoute('/_app/manage/projects')({
  staticData: { pageTitle: 'Manage Projects' },
  component: ManageProjects,
})
