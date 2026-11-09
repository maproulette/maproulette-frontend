import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { NotificationsPage } from '@/components/Pages/NotificationsPage'

const notificationsSearchSchema = z.object({
  notificationId: z.coerce.number().optional(),
  category: z.enum(['all', 'task_comment', 'mention', 'challenge', 'team', 'system']).optional(),
  status: z.enum(['all', 'unread', 'read']).optional(),
  task: z.string().optional(),
  type: z.string().optional(),
  from: z.string().optional(),
  challenge: z.string().optional(),
  view: z.string().optional(),
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
