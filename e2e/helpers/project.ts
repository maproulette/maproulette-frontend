import type { APIRequestContext } from '@playwright/test'
import type { Challenge } from '@/types/Challenge'
import type { Project } from '@/types/Project'
import { BACKEND_URL } from '../fixtures'

export const TASK_STATUS = {
  created: 0,
  fixed: 1,
  falsePositive: 2,
  skipped: 3,
  alreadyFixed: 5,
  tooHard: 6,
} as const

const uniqueName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

type ApiResponse = Awaited<ReturnType<APIRequestContext['get']>>

async function check(response: ApiResponse, what: string) {
  if (!response.ok()) {
    throw new Error(`${what} failed: ${response.status()} ${await response.text()}`)
  }
}

async function ok<T>(response: ApiResponse, what: string) {
  await check(response, what)
  return (await response.json()) as T
}

export async function getProject(request: APIRequestContext, id: number) {
  return ok<Project>(await request.get(`${BACKEND_URL}/api/v2/project/${id}`), 'Get project')
}

export async function findProjectByName(request: APIRequestContext, name: string) {
  const projects = await ok<Project[]>(
    await request.get(`${BACKEND_URL}/api/v2/projects/managed?limit=500`),
    'List managed projects'
  )
  return projects.find((project) => project.name === name)
}

export async function deleteProjectNow(request: APIRequestContext, id: number) {
  const response = await request.delete(`${BACKEND_URL}/api/v2/project/${id}?immediate=true`)
  if (!response.ok()) {
    console.warn(`Project ${id} teardown returned ${response.status()}`)
  }
}

export async function getProjectChallenges(request: APIRequestContext, projectId: number) {
  return ok<Challenge[]>(
    await request.get(`${BACKEND_URL}/api/v2/project/${projectId}/challenges?limit=100`),
    'List project challenges'
  )
}

export async function addChallenge(
  request: APIRequestContext,
  projectId: number,
  options: { name?: string; enabled?: boolean; statuses?: number[] } = {}
) {
  const name = options.name ?? uniqueName('e2e-project-challenge')
  const challenge = await ok<{ id: number }>(
    await request.post(`${BACKEND_URL}/api/v2/challenge`, {
      data: {
        parent: projectId,
        name,
        description: `Description of ${name}`,
        instruction: 'Fix the identified issue.',
        difficulty: 2,
        checkinComment: 'E2E test changeset #maproulette',
        checkinSource: 'Bing',
        enabled: options.enabled ?? true,
        featured: false,
        overpassQL: '',
        overpassTargetType: '',
      },
    }),
    'Create challenge'
  )

  const statuses = options.statuses ?? []
  for (const [index, status] of statuses.entries()) {
    const task = await ok<{ id: number }>(
      await request.post(`${BACKEND_URL}/api/v2/task`, {
        data: {
          name: uniqueName(`e2e-project-task-${index}`),
          parent: challenge.id,
          instruction: 'Fix this point.',
          geometries: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-95.45 + index * 0.001, 37.68] },
                properties: {},
              },
            ],
          },
          priority: 0,
        },
      }),
      'Create task'
    )
    if (status !== TASK_STATUS.created) {
      await check(
        await request.put(`${BACKEND_URL}/api/v2/task/${task.id}/${status}`),
        'Set task status'
      )
    }
  }

  return { id: challenge.id, name }
}

export async function archiveChallenge(request: APIRequestContext, challengeId: number) {
  await check(
    await request.post(`${BACKEND_URL}/api/v2/challenge/${challengeId}/archive`, {
      data: { isArchived: true },
    }),
    'Archive challenge'
  )
}
