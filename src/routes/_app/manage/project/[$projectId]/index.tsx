import { createFileRoute } from '@tanstack/react-router'
import { ManageProjectDetail } from '@/components/Pages/ManagementPages/ManageProjectDetail'

export const Route = createFileRoute('/_app/manage/project/$projectId/')({
  staticData: { pageTitle: 'Manage Project' },
  component: ManageProjectDetail,
})
