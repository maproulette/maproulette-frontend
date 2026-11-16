import type { APIRequestContext, Page } from '@playwright/test'
import type { ChallengeStatsResponse } from '@/types/Challenge'
import type { Comment } from '@/types/Comment'
import type { TaskGetResponse } from '@/types/Task'
import type { UserMetricsResponse } from '@/types/User'
import {
  BACKEND_URL,
  test as base,
  createTask,
  expect,
  newSessionRequest,
  expectOk as ok,
  pageAs,
  runSql,
  seedUser,
  type TestTask,
  type TestUser,
  uniqueName,
} from '../fixtures'

export { TASK_STATUS } from '@/lib/taskStatusProgressions'

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

export async function completeViaApi(request: APIRequestContext, taskId: number, status: number) {
  await ok(
    await request.get(`${BACKEND_URL}/api/v2/task/${taskId}/start`),
    `Locking task ${taskId}`
  )
  await ok(
    await request.put(`${BACKEND_URL}/api/v2/task/${taskId}/${status}`),
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

interface StoredTaskRow {
  completedBy: number | null
  mappedOn: string | null
  skipCount: number
}

export function storedTaskRows(taskIds: number[]): Map<number, StoredTaskRow> {
  const output = runSql(
    `SELECT id, completed_by, mapped_on, skip_count FROM tasks WHERE id IN (${taskIds.join(',')});`
  )
  return new Map(
    output
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [id, completedBy, mappedOn, skipCount] = line.split('|')
        return [
          Number(id),
          {
            completedBy: completedBy ? Number(completedBy) : null,
            mappedOn: mappedOn || null,
            skipCount: Number(skipCount),
          },
        ]
      })
  )
}

export function storedTaskRow(taskId: number): StoredTaskRow {
  const row = storedTaskRows([taskId]).get(taskId)
  if (!row) throw new Error(`Task ${taskId} has no row`)
  return row
}

export interface Mapper {
  user: TestUser
  page: Page
  request: APIRequestContext
}

export const test = base.extend<{ extraTasks: TestTask[]; mapper: Mapper }>({
  mapper: async ({ browser, playwright }, use) => {
    const user = seedUser(
      uniqueName('e2e-task-mapper'),
      700_000_000 + Math.floor(Math.random() * 90_000_000)
    )
    const page = await pageAs(browser, user)
    const request = await newSessionRequest(playwright.request, user)

    await use({ user, page, request })

    await request.dispose()
    await page.context().close()
    try {
      runSql(
        `DELETE FROM locked WHERE user_id = ${user.id}; DELETE FROM users WHERE id = ${user.id};`
      )
    } catch (error) {
      console.warn(`Mapper ${user.id} teardown threw:`, error)
    }
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
        await createTask(request, challenge.id, {
          name: `e2e-extra-${index}-${Date.now()}`,
          coordinates: point,
          properties: { name: `Extra feature ${index}` },
          instruction: 'Fix this point.',
          priority: 0,
        })
      )
    }
    await use(tasks)
  },
})

export { expect }
