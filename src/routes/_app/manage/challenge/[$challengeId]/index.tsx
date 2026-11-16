import { createFileRoute } from '@tanstack/react-router'
import { ManageChallengeDetail } from '@/components/Pages/ManagementPages/ManageChallengeDetail'

export const Route = createFileRoute('/_app/manage/challenge/$challengeId/')({
  staticData: { pageTitle: 'Manage Challenge' },
  component: ManageChallengeDetail,
})
