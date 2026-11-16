import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/Pages/SettingsPage'

export const Route = createFileRoute('/_app/settings')({
  staticData: { pageTitle: 'Settings' },
  head: () => ({
    meta: [
      {
        title: 'Settings',
      },
    ],
  }),
  component: SettingsPage,
})
