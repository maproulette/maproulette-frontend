import { createFileRoute } from '@tanstack/react-router'
import { ManageProjectEdit } from '@/components/Pages/ManagementPages/ManageProjectEdit'

export const Route = createFileRoute('/_app/manage/project/$projectId/edit')({
  staticData: { pageTitle: 'Edit Project' },
  component: ManageProjectEdit,
})
