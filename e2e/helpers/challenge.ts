import type { APIRequestContext, Page } from '@playwright/test'
import type { Challenge } from '@/types/Challenge'
import type { components } from '@/types/openApiTypes'
import {
  BACKEND_URL,
  test as base,
  createProject,
  deleteProject,
  expect,
  type TestProject,
  uniqueName,
} from '../fixtures'

export const BASEMAP_IDENTIFIED = 4
export const BASEMAP_CUSTOM = 3
export const BASEMAP_NONE = -1

export const PRIORITY_HIGH = 0
export const PRIORITY_LOW = 2

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

export async function pickOption(page: Page, label: string | RegExp, option: string | RegExp) {
  await page.getByLabel(label).click()
  await page.getByRole('option', { name: option, exact: typeof option === 'string' }).click()
}

export async function openPrioritization(page: Page, challengeId: number) {
  await page.goto(`/manage/challenge/${challengeId}/prioritization`)
  await expect(page.getByText('Default priority')).toBeVisible({ timeout: 20_000 })
}

export const test = base.extend<{ otherProject: TestProject }>({
  otherProject: async ({ request }, use) => {
    const project = await createProject(request, { name: uniqueName('e2e-other-project') })
    await use(project)
    await deleteProject(request, project.id)
  },
})

export { expect }
