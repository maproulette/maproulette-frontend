import type { APIRequestContext } from '@playwright/test'
import type { Notification } from '@/types/Notification'
import { BACKEND_URL, type TestUser } from './fixtures'
import { expect, test } from './helpers/misc'

const mention = async (request: APIRequestContext, taskId: number, user: TestUser) => {
  const response = await request.post(`${BACKEND_URL}/api/v2/task/${taskId}/comment`, {
    data: { comment: `Could you check this, @${user.name}?` },
  })
  expect(response.ok()).toBe(true)
}

const storedNotifications = async (request: APIRequestContext, user: TestUser) => {
  const response = await request.get(`${BACKEND_URL}/api/v2/user/${user.id}/notifications`)
  expect(response.ok()).toBe(true)
  return (await response.json()) as Notification[]
}

test('a mention arrives unread and can be marked read and unread again', async ({
  request,
  taskSet,
  member,
  memberPage: page,
  memberRequest,
}) => {
  await mention(request, taskSet[0].id, member)

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (1)' })).toBeVisible({ timeout: 20_000 })

  const item = page.getByRole('listitem').filter({ hasText: `task ${taskSet[0].id}` })
  await expect(item).toContainText('e2e-super-user mentioned you on task')
  await expect(item).toContainText('Could you check this')

  await item.getByRole('button', { name: 'Mark as read' }).click()
  await expect(page.getByRole('tab', { name: 'Unread (0)' })).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member))[0]?.isRead)
    .toBe(true)

  await page.getByRole('tab', { name: 'All (1)' }).click()
  await item.getByRole('button', { name: 'Mark as unread' }).click()
  await expect(page.getByRole('tab', { name: 'Unread (1)' })).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member))[0]?.isRead)
    .toBe(false)
})

test('following a notification from the header opens the task and marks it read', async ({
  request,
  taskSet,
  member,
  memberPage: page,
  memberRequest,
}) => {
  await mention(request, taskSet[0].id, member)

  await page.goto('/dashboard')
  await page.getByRole('button', { name: /^Notifications for/ }).click()
  await page
    .getByRole('dialog', { name: 'Notifications' })
    .getByRole('link', { name: new RegExp(`mentioned you on task ${taskSet[0].id}`) })
    .click({ timeout: 20_000 })

  await expect(page).toHaveURL(new RegExp(`/tasks/${taskSet[0].id}`), { timeout: 15_000 })
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member))[0]?.isRead)
    .toBe(true)
})

test('selected notifications can be marked read and deleted together', async ({
  request,
  taskSet,
  member,
  memberPage: page,
  memberRequest,
}) => {
  await mention(request, taskSet[0].id, member)
  await mention(request, taskSet[1].id, member)
  await mention(request, taskSet[2].id, member)

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (3)' })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('checkbox', { name: 'Select all notifications' }).click()
  await expect(page.getByText('3 selected')).toBeVisible()
  await page.getByRole('button', { name: 'Mark as read', exact: true }).first().click()
  await expect(page.getByRole('tab', { name: 'Unread (0)' })).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member)).every((n) => n.isRead))
    .toBe(true)

  await page.getByRole('tab', { name: 'All (3)' }).click()
  await page
    .getByRole('listitem')
    .filter({ hasText: `task ${taskSet[0].id}` })
    .getByRole('checkbox', { name: 'Select notification' })
    .click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByRole('tab', { name: 'All (2)' })).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member)).map((n) => n.taskId))
    .not.toContain(taskSet[0].id)
})
