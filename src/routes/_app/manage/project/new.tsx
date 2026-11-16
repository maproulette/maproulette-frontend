import { createFileRoute } from '@tanstack/react-router'
import { ManageProjectNew } from '@/components/Pages/ManagementPages/ManageProjectNew'

export const Route = createFileRoute('/_app/manage/project/new')({
  staticData: { pageTitle: 'Create Project' },
  component: ManageProjectNew,
})
