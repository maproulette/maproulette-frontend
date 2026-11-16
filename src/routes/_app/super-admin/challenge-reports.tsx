import { createFileRoute } from '@tanstack/react-router'
import { SuperAdminChallengeReports } from '@/components/Pages/SuperAdminPages/SuperAdminChallengeReports'

export const Route = createFileRoute('/_app/super-admin/challenge-reports')({
  staticData: { pageTitle: 'Challenge Reports' },
  component: SuperAdminChallengeReports,
})
