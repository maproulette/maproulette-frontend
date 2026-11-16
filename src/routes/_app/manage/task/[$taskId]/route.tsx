import { createFileRoute } from '@tanstack/react-router'
import { requireIds } from '@/lib/routeParams'

export const Route = createFileRoute('/_app/manage/task/$taskId')({
  loader: ({ params }) => requireIds(params),
  head: () => ({
    meta: [
      {
        title: 'Task',
      },
    ],
  }),
})
