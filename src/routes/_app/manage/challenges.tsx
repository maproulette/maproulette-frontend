import { createFileRoute } from '@tanstack/react-router'
import { ManageChallenges } from '@/components/Pages/ManagementPages/ManageChallenges'

export const Route = createFileRoute('/_app/manage/challenges')({
  staticData: { pageTitle: 'Manage Challenges' },
  component: ManageChallenges,
})
