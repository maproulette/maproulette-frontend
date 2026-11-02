import type { APIRequestContext, Page } from '@playwright/test'
import type { Challenge } from '@/types/Challenge'
import type { components } from '@/types/openApiTypes'
import type { Project } from '@/types/Project'
import type { Task, TaskGetResponse } from '@/types/Task'
import { BACKEND_URL, test as base, expect, storedProjectId, type TestProject } from '../fixtures'

export const BASEMAP_IDENTIFIED = 4
export const BASEMAP_CUSTOM = 3
export const BASEMAP_NONE = -1

export const PRIORITY_HIGH = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_LOW = 2

export const uniqueName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

export async function readChallenge(request: APIRequestContext, id: number): Promise<Challenge> {
  const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${id}`)
  expect(response.ok(), `GET challenge ${id} returned ${response.status()}`).toBe(true)
  return (await response.json()) as Challenge
}

export async function challengeExists(request: APIRequestContext, id: number): Promise<boolean> {
  const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${id}`)
  if (response.status() === 404) return false
  const body = (await response.json()) as Challenge
  return body.deleted !== true
}

export async function readChallengeKeywords(
  request: APIRequestContext,
  id: number
): Promise<string[]> {
  const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${id}/tags`)
  expect(response.ok()).toBe(true)
  const tags =
    (await response.json()) as components['schemas']['org.maproulette.framework.model.Tag'][]
  return tags.map((tag) => tag.name).sort()
}

export async function updateChallenge(
  request: APIRequestContext,
  id: number,
  data: Record<string, unknown>
): Promise<void> {
  const response = await request.put(`${BACKEND_URL}/api/v2/challenge/${id}`, {
    headers: { 'Content-Type': 'application/json' },
    data,
  })
  if (!response.ok()) {
    throw new Error(`Failed to update challenge: ${response.status()} ${await response.text()}`)
  }
}

export async function listProjectChallenges(
  request: APIRequestContext,
  projectId: number
): Promise<Challenge[]> {
  const response = await request.get(
    `${BACKEND_URL}/api/v2/project/${projectId}/challenges?limit=100`
  )
  expect(response.ok()).toBe(true)
  return (await response.json()) as Challenge[]
}

export async function createPropertyTask(
  request: APIRequestContext,
  challengeId: number,
  name: string,
  properties: Record<string, string>,
  coordinates: [number, number] = [-95.454772, 37.6866588]
): Promise<TaskGetResponse> {
  const response = await request.post(`${BACKEND_URL}/api/v2/task`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      name,
      parent: challengeId,
      instruction: 'Fix this point.',
      geometries: {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates }, properties }],
      },
    },
  })
  if (!response.ok()) {
    throw new Error(`Failed to create task: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as Task
  return readTask(request, body.id)
}

export async function readTask(request: APIRequestContext, id: number): Promise<TaskGetResponse> {
  const response = await request.get(`${BACKEND_URL}/api/v2/task/${id}`)
  expect(response.ok()).toBe(true)
  return (await response.json()) as TaskGetResponse
}

export async function pickOption(page: Page, label: string | RegExp, option: string | RegExp) {
  await page.getByLabel(label).click()
  await page.getByRole('option', { name: option, exact: typeof option === 'string' }).click()
}

async function createProject(request: APIRequestContext, name: string): Promise<TestProject> {
  const response = await request.post(`${BACKEND_URL}/api/v2/project`, {
    headers: { 'Content-Type': 'application/json' },
    data: { name, displayName: name, description: 'E2E second project', enabled: true },
  })
  if (!response.ok()) {
    throw new Error(`Failed to create project: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as Project
  return { id: storedProjectId(body), name }
}

export const test = base.extend<{ otherProject: TestProject }>({
  otherProject: async ({ request }, use) => {
    const project = await createProject(request, uniqueName('e2e-other-project'))
    await use(project)
    const response = await request.delete(
      `${BACKEND_URL}/api/v2/project/${project.id}?immediate=true`
    )
    if (!response.ok()) {
      console.warn(`Project ${project.id} teardown returned ${response.status()}`)
    }
  },
})

export { expect }
