import type { APIRequestContext } from '@playwright/test'
import { TASK_STATUS } from '@/lib/taskStatusProgressions'
import type { Challenge } from '@/types/Challenge'
import type { Project } from '@/types/Project'
import { BACKEND_URL, createChallenge, createTask, expectOk, uniqueName } from '../fixtures'

export async function getProject(request: APIRequestContext, id: number) {
  const response = await expectOk(
    await request.get(`${BACKEND_URL}/api/v2/project/${id}`),
    'Get project'
  )
  return (await response.json()) as Project
}

export async function findProjectByName(request: APIRequestContext, name: string) {
  const response = await expectOk(
    await request.get(`${BACKEND_URL}/api/v2/projects/managed?limit=500`),
    'List managed projects'
  )
  return ((await response.json()) as Project[]).find((project) => project.name === name)
}

export async function getProjectChallenges(request: APIRequestContext, projectId: number) {
  const response = await expectOk(
    await request.get(`${BACKEND_URL}/api/v2/project/${projectId}/challenges?limit=100`),
    'List project challenges'
  )
  return (await response.json()) as Challenge[]
}

export async function addChallenge(
  request: APIRequestContext,
  projectId: number,
  options: { name?: string; enabled?: boolean; statuses?: number[] } = {}
) {
  const name = options.name ?? uniqueName('e2e-project-challenge')
  const challenge = await createChallenge(request, projectId, {
    name,
    description: `Description of ${name}`,
    enabled: options.enabled ?? true,
  })

  const statuses = options.statuses ?? []
  for (const [index, status] of statuses.entries()) {
    const task = await createTask(request, challenge.id, {
      name: uniqueName(`e2e-project-task-${index}`),
      coordinates: [-95.45 + index * 0.001, 37.68],
      instruction: 'Fix this point.',
      priority: 0,
    })
    if (status !== TASK_STATUS.created) {
      await expectOk(
        await request.put(`${BACKEND_URL}/api/v2/task/${task.id}/${status}`),
        'Set task status'
      )
    }
  }

  return { id: challenge.id, name }
}

export async function archiveChallenge(request: APIRequestContext, challengeId: number) {
  await expectOk(
    await request.post(`${BACKEND_URL}/api/v2/challenge/${challengeId}/archive`, {
      data: { isArchived: true },
    }),
    'Archive challenge'
  )
}
