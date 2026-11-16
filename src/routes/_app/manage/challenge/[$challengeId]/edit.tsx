import { createFileRoute } from '@tanstack/react-router'
import { ManageChallengeEdit } from '@/components/Pages/ManagementPages/ManageChallengeEdit'

export const Route = createFileRoute('/_app/manage/challenge/$challengeId/edit')({
  staticData: { pageTitle: 'Edit Challenge' },
  component: ManageChallengeEdit,
})
