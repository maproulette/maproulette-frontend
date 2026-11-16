import { createFileRoute } from '@tanstack/react-router'
import { SuperAdminTeamImages } from '@/components/Pages/SuperAdminPages/SuperAdminTeamImages'

export const Route = createFileRoute('/_app/super-admin/team-images')({
  staticData: { pageTitle: 'Team Challenge Images' },
  component: SuperAdminTeamImages,
})
