import type { APIRequestContext, Page } from '@playwright/test'
import {
  test as base,
  createTask,
  deleteSeededUser,
  newSessionRequest,
  pageAs,
  seedUser,
  type TestTask,
  type TestUser,
} from '../fixtures'

export const taskRow = (page: Page, id: number) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: String(id), exact: true }) })

export const test = base.extend<{
  taskSet: TestTask[]
  member: TestUser
  memberPage: Page
  memberRequest: APIRequestContext
}>({
  taskSet: async ({ request, challenge }, use) => {
    const tasks = []
    for (const [index, kind] of ['road', 'river', 'road'].entries()) {
      tasks.push(
        await createTask(request, challenge.id, {
          name: `${challenge.name}-task-${index}`,
          coordinates: [-95.454772 + index * 0.001, 37.6866588],
          properties: { kind },
          instruction: 'Fix this point.',
        })
      )
    }
    await use(tasks)
  },

  member: async ({ request: _request }, use) => {
    const user = seedUser(
      `e2emember${Date.now()}${Math.floor(Math.random() * 1_000_000)}`,
      600_000_000 + Math.floor(Math.random() * 90_000_000)
    )
    await use(user)
    deleteSeededUser(user)
  },

  memberPage: async ({ browser, member }, use) => {
    const page = await pageAs(browser, member)
    await use(page)
    await page.context().close()
  },

  memberRequest: async ({ playwright, member }, use) => {
    const request = await newSessionRequest(playwright.request, member)
    await use(request)
    await request.dispose()
  },
})

export { expect } from '../fixtures'
