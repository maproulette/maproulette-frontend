import { createFileRoute } from '@tanstack/react-router'
import { ManagementLayout } from '@/components/Pages/ManagementPages/ManagementLayout'

export const Route = createFileRoute('/_app/manage')({
  component: ManagementLayout,
})
