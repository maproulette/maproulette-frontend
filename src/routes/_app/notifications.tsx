import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { NotificationsPage } from '@/components/Pages/NotificationsPage'

const notificationsSearchSchema = z.object({
  tab: z.enum(['unread', 'all']).optional().catch(undefined),
})

export const Route = createFileRoute('/_app/notifications')({
  validateSearch: notificationsSearchSchema,
  staticData: { pageTitle: 'Notifications' },
  head: () => ({
    meta: [
      {
        title: 'Notifications',
      },
    ],
  }),
  component: NotificationsPage,
})
