import { createFileRoute, notFound } from '@tanstack/react-router'
import { HTTPError } from 'ky'
import { projectOptions } from '@/api/project'
import { BrowsedProjectPage } from '@/components/Pages/BrowsedProjectPage'
import { logger } from '@/lib/logger'
import { requireIds } from '@/lib/routeParams'

export const Route = createFileRoute('/_app/project/$projectId/')({
  staticData: { pageTitle: 'Browse Project' },
  loader: async ({ params, context: { queryClient } }) => {
    requireIds(params)
    const { projectId } = params
    try {
      const project = await queryClient.ensureQueryData(projectOptions(Number(projectId)))

      return { project }
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 404) {
        logger.error('Project not found', { projectId, error })
        throw notFound()
      }
      throw error
    }
  },
  head: ({ loaderData }) => {
    const project = loaderData?.project

    return {
      meta: [
        {
          title: project?.displayName
            ? `Project: ${project.displayName}`
            : project?.name
              ? `Project: ${project.name}`
              : 'Loading project',
        },
      ],
    }
  },
  component: BrowsedProjectPage,
})
