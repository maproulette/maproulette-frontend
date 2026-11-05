import type { APIRequestContext, Browser, Page } from '@playwright/test'
import type { Task } from '@/types/Task'
import {
  BACKEND_URL,
  test as base,
  deleteSeededUser,
  seedUser,
  sessionCookie,
  type TestTask,
  type TestUser,
} from '../fixtures'

async function addTask(
  request: APIRequestContext,
  challengeId: number,
  name: string,
  coordinates: [number, number],
  properties: Record<string, string> = {}
): Promise<TestTask> {
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
  return { id: body.id, name, challengeId, coordinates }
}

export async function storedTasks(
  request: APIRequestContext,
  challengeId: number
): Promise<Map<number, Task>> {
  const response = await request.get(
    `${BACKEND_URL}/api/v2/challenge/${challengeId}/tasks?limit=-1`
  )
  if (!response.ok()) {
    throw new Error(`Failed to list challenge ${challengeId} tasks: ${response.status()}`)
  }
  const tasks = (await response.json()) as Task[]
  return new Map(tasks.map((task) => [task.id, task]))
}

async function pageAs(browser: Browser, user: TestUser): Promise<Page> {
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
  return context.newPage()
}

const seededName = (prefix: string) =>
  `${prefix}${Date.now()}${Math.floor(Math.random() * 1_000_000)}`

export const test = base.extend<{
  taskSet: TestTask[]
  member: TestUser
  memberPage: Page
}>({
  taskSet: async ({ request, challenge }, use) => {
    const tasks = []
    for (const [index, kind] of ['road', 'river', 'road'].entries()) {
      tasks.push(
        await addTask(
          request,
          challenge.id,
          `${challenge.name}-task-${index}`,
          [-95.454772 + index * 0.001, 37.6866588],
          { kind }
        )
      )
    }
    await use(tasks)
  },

  member: async ({ request: _request }, use) => {
    const user = seedUser(
      seededName('e2emember'),
      700_000_000 + Math.floor(Math.random() * 90_000_000)
    )
    await use(user)
    deleteSeededUser(user)
  },

  memberPage: async ({ browser, member }, use) => {
    const page = await pageAs(browser, member)
    await use(page)
    await page.context().close()
  },
})

export { expect } from '../fixtures'
