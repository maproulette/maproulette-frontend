import { createFileRoute } from '@tanstack/react-router'
import { TaskPrioritizationPage } from '@/components/Pages/ManagementPages/TaskPrioritizationPage'

const PrioritizationRouteComponent = () => {
  const { challengeId } = Route.useParams()
  return <TaskPrioritizationPage challengeId={Number(challengeId)} />
}

export const Route = createFileRoute('/_app/manage/challenge/$challengeId/prioritization')({
  staticData: { pageTitle: 'Task Prioritization' },
  component: PrioritizationRouteComponent,
})
