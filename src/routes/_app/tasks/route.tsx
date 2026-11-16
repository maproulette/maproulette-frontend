import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/tasks')({
  head: () => ({
    meta: [
      {
        title: 'Tasks',
      },
    ],
  }),
  component: Outlet,
})
