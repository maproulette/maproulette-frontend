import { createFileRoute, redirect } from '@tanstack/react-router'

// The manage-side task detail page is gone: a task is viewed at /tasks/$taskId,
// where challenge managers reach the edit form from the header's overflow menu.
export const Route = createFileRoute('/_app/manage/task/$taskId/')({
  beforeLoad: ({ params: { taskId } }) => {
    throw redirect({ to: '/tasks/$taskId', params: { taskId } })
  },
})
