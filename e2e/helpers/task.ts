import type { APIRequestContext, Page } from '@playwright/test'
import type { ChallengeStatsResponse } from '@/types/Challenge'
import type { Comment } from '@/types/Comment'
import type { components } from '@/types/openApiTypes'
import type { Task, TaskGetResponse } from '@/types/Task'
import type { UserMetricsResponse } from '@/types/User'
import {
  BACKEND_URL,
  test as base,
  deleteSeededUser,
  expect,
  newSessionRequest,
  runSql,
  seedUser,
  sessionCookie,
  type TestTask,
  type TestUser,
} from '../fixtures'

export const TASK_STATUS = {
  created: 0,
  fixed: 1,
  falsePositive: 2,
  skipped: 3,
  alreadyFixed: 5,
  tooHard: 6,
} as const

const ok = async (response: Awaited<ReturnType<APIRequestContext['get']>>, what: string) => {
  if (!response.ok()) {
    throw new Error(`${what} failed: ${response.status()} ${await response.text()}`)
  }
  return response
}

async function createTask(
  request: APIRequestContext,
  challengeId: number,
  name: string,
  coordinates: [number, number],
  properties: Record<string, string> = {}
): Promise<TestTask> {
  const response = await ok(
    await request.post(`${BACKEND_URL}/api/v2/task`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        name,
        parent: challengeId,
        instruction: 'Fix this point.',
        geometries: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates }, properties }],
        },
        priority: 0,
      },
    }),
    'Creating a task'
  )
  const body = (await response.json()) as Task
  return { id: body.id, name, challengeId, coordinates }
}

export async function getTask(
  request: APIRequestContext,
  taskId: number
): Promise<TaskGetResponse> {
  const response = await ok(
    await request.get(`${BACKEND_URL}/api/v2/task/${taskId}?mapillary=false`),
    `Reading task ${taskId}`
  )
  return (await response.json()) as TaskGetResponse
}

export async function getTaskComments(
  request: APIRequestContext,
  taskId: number
): Promise<Comment[]> {
  const response = await ok(
    await request.get(`${BACKEND_URL}/api/v2/task/${taskId}/comments`),
    `Reading comments on task ${taskId}`
  )
  return (await response.json()) as Comment[]
}

export async function getChallengeActions(
  request: APIRequestContext,
  challengeId: number
): Promise<ChallengeStatsResponse[number]['actions']> {
  const response = await ok(
    await request.get(`${BACKEND_URL}/api/v2/data/challenge/${challengeId}`),
    `Reading stats for challenge ${challengeId}`
  )
  const [stats] = (await response.json()) as ChallengeStatsResponse
  return stats.actions
}

export async function getUserTaskMetrics(
  request: APIRequestContext,
  userId: number
): Promise<UserMetricsResponse['tasks']> {
  const range = { start: '2000-01-01', end: '2100-01-01' }
  const response = await ok(
    await request.get(`${BACKEND_URL}/api/v2/data/user/${userId}/metrics`, {
      params: {
        ...range,
        reviewStart: range.start,
        reviewEnd: range.end,
        reviewerStart: range.start,
        reviewerEnd: range.end,
      },
    }),
    `Reading metrics for user ${userId}`
  )
  return ((await response.json()) as UserMetricsResponse).tasks
}

export async function completeViaApi(mapper: Mapper, taskId: number, status: number) {
  await ok(
    await mapper.request.get(`${BACKEND_URL}/api/v2/task/${taskId}/start`),
    `Locking task ${taskId}`
  )
  await ok(
    await mapper.request.put(`${BACKEND_URL}/api/v2/task/${taskId}/${status}`),
    `Setting task ${taskId} to ${status}`
  )
}

export async function startMapping(page: Page, taskId: number) {
  await page.goto(`/tasks/${taskId}`)
  await expect(page.getByText(`Task #${taskId}`).first()).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Map this task' }).click()
  await expect(page.getByText('Completion: Set Task Status')).toBeVisible({ timeout: 20_000 })
}

export async function dismissDialogs(page: Page) {
  await expect(async () => {
    if (
      await page
        .getByRole('dialog')
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await page.keyboard.press('Escape')
    }
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 500 })
  }).toPass({ timeout: 30_000 })
}

export async function completeTask(
  page: Page,
  statusButton: string,
  { comment, toast }: { comment?: string; toast: string }
) {
  await page.getByRole('button', { name: statusButton, exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Complete Task Action' })
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  if (comment) await dialog.getByLabel('Comment (Optional)').fill(comment)
  await dialog.getByRole('button', { name: 'Complete & Continue' }).click()
  await expect(page.getByText(`Task marked as ${toast}`)).toBeVisible({ timeout: 15_000 })
}

export function storedTaskRow(taskId: number) {
  const [completedBy, mappedOn, skipCount] = runSql(
    `SELECT completed_by, mapped_on, skip_count FROM tasks WHERE id = ${taskId};`
  ).split('|')
  return {
    completedBy: completedBy ? Number(completedBy) : null,
    mappedOn: mappedOn || null,
    skipCount: Number(skipCount),
  }
}

export interface Mapper {
  user: TestUser
  page: Page
  request: APIRequestContext
}

async function releaseLocksOf(request: APIRequestContext, userId: number) {
  const locked = await request.get(`${BACKEND_URL}/api/v2/user/${userId}/lockedTasks`)
  if (!locked.ok()) return
  for (const task of (await locked.json()) as components['schemas']['org.maproulette.framework.model.LockedTaskData'][]) {
    await request.get(`${BACKEND_URL}/api/v2/task/${task.id}/release`)
  }
}

export const test = base.extend<{ extraTasks: TestTask[]; mapper: Mapper }>({
  mapper: async ({ browser, playwright }, use) => {
    const user = seedUser(
      `e2e-task-mapper-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
      700_000_000 + Math.floor(Math.random() * 90_000_000)
    )
    const context = await browser.newContext({
      storageState: {
        cookies: [
          {
            name: 'PLAY_SESSION',
            value: sessionCookie(user),
            domain: new URL(BACKEND_URL).hostname,
            path: '/',
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    })
    const page = await context.newPage()
    const request = await newSessionRequest(playwright.request, user)

    await use({ user, page, request })

    await releaseLocksOf(request, user.id)
    await request.dispose()
    await context.close()
    runSql(`DELETE FROM locked WHERE user_id = ${user.id};`)
    deleteSeededUser(user)
  },

  extraTasks: async ({ request, challenge }, use) => {
    const coordinates: [number, number][] = [
      [-95.453772, 37.6876588],
      [-95.455772, 37.6856588],
      [-95.452772, 37.6856588],
    ]
    const tasks: TestTask[] = []
    for (const [index, point] of coordinates.entries()) {
      tasks.push(
        await createTask(request, challenge.id, `e2e-extra-${index}-${Date.now()}`, point, {
          name: `Extra feature ${index}`,
        })
      )
    }
    await use(tasks)
  },
})

export { expect }
