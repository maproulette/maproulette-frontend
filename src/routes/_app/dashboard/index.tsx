import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/components/Pages/DashboardPage'

export const Route = createFileRoute('/_app/dashboard/')({
  staticData: { pageTitle: 'Dashboard' },
  head: () => ({
    meta: [
      {
        title: 'Dashboard',
      },
    ],
  }),
  component: Dashboard,
})
