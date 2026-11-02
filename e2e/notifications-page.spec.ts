import type { APIRequestContext } from '@playwright/test'
import type { UserNotificationsResponse } from '@/types/User'
import { BACKEND_URL, newSessionRequest, type TestUser } from './fixtures'
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
  return (await response.json()) as UserNotificationsResponse
}

test('a mention arrives unread and can be marked read and unread again', async ({
  playwright,
  request,
  taskSet,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)
  await mention(request, taskSet[0].id, member)

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (1)' })).toBeVisible({ timeout: 20_000 })

  const item = page.getByRole('listitem').filter({ hasText: `Task #${taskSet[0].id}` })
  await expect(item).toContainText('e2e-super-user')
  await expect(item).toContainText('Comment Mention')

  await item.getByRole('button', { name: 'Mark as read' }).click()
  await expect(page.getByRole('tab', { name: 'Unread (0)' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('tab', { name: 'All (1)' })).toBeVisible()
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member))[0]?.isRead)
    .toBe(true)

  await page.getByRole('tab', { name: 'All (1)' }).click()
  await item.getByRole('button', { name: 'Mark as unread' }).click()
  await expect(page.getByRole('tab', { name: 'Unread (1)' })).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member))[0]?.isRead)
    .toBe(false)

  await memberRequest.dispose()
})

test('a deleted notification is gone for good', async ({
  playwright,
  request,
  taskSet,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)
  await mention(request, taskSet[0].id, member)
  await mention(request, taskSet[1].id, member)

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (2)' })).toBeVisible({ timeout: 20_000 })

  await page
    .getByRole('listitem')
    .filter({ hasText: `Task #${taskSet[0].id}` })
    .getByRole('button', { name: 'Delete notification' })
    .click()

  await expect(page.getByRole('tab', { name: 'Unread (1)' })).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByRole('listitem').filter({ hasText: `Task #${taskSet[0].id}` })
  ).toHaveCount(0)

  await expect
    .poll(async () => (await storedNotifications(memberRequest, member)).map((n) => n.taskId))
    .toEqual([taskSet[1].id])

  await page.reload()
  await expect(page.getByRole('tab', { name: 'Unread (1)' })).toBeVisible({ timeout: 20_000 })
  await memberRequest.dispose()
})

test('notifications group by task, and selecting them all marks every one read', async ({
  playwright,
  request,
  taskSet,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)
  await mention(request, taskSet[0].id, member)
  await mention(request, taskSet[0].id, member)
  await mention(request, taskSet[1].id, member)

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (3)' })).toBeVisible({ timeout: 20_000 })

  const threadItems = page.getByRole('listitem').filter({ hasText: 'Comment Mention' })
  await expect(threadItems).toHaveCount(2)
  await expect(threadItems.filter({ hasText: `Task #${taskSet[0].id}` })).toContainText('2')

  await page.getByRole('checkbox', { name: 'Group by Task' }).click()
  await expect(threadItems).toHaveCount(3)

  await page.getByRole('checkbox', { name: 'Select all notifications' }).click()
  await expect(page.getByText('3 of 3 selected')).toBeVisible()
  await page.getByRole('button', { name: 'Mark 3 as read' }).click()

  await expect(page.getByRole('tab', { name: 'Unread (0)' })).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(async () => (await storedNotifications(memberRequest, member)).every((n) => n.isRead))
    .toBe(true)
  await memberRequest.dispose()
})

test('the category and task filters count and narrow the notifications', async ({
  request,
  taskSet,
  member,
  memberPage: page,
}) => {
  await mention(request, taskSet[0].id, member)
  await mention(request, taskSet[1].id, member)

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (2)' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('checkbox', { name: 'Group by Task' }).click()

  await expect(page.getByRole('button', { name: 'Mentions 2' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Challenges 0' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Reviews/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Challenges 0' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Comment Mention' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Mentions 2' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Comment Mention' })).toHaveCount(2)

  await page.getByRole('combobox').filter({ hasText: 'Task' }).click()
  await page.getByRole('option', { name: `Task #${taskSet[1].id}` }).click()
  const items = page.getByRole('listitem').filter({ hasText: 'Comment Mention' })
  await expect(items).toHaveCount(1)
  await expect(items).toContainText(`Task #${taskSet[1].id}`)

  await page.reload()
  await expect(items).toHaveCount(1, { timeout: 20_000 })
  await expect(items).toContainText(`Task #${taskSet[1].id}`)

  await page.getByRole('button', { name: 'Clear Filters' }).click()
  await expect(items).toHaveCount(2)
})

test('a filtered view can be saved, re-applied after clearing, renamed and deleted', async ({
  request,
  taskSet,
  member,
  memberPage: page,
}) => {
  await mention(request, taskSet[0].id, member)
  await mention(request, taskSet[1].id, member)

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (2)' })).toBeVisible({ timeout: 20_000 })
  const items = page.getByRole('listitem').filter({ hasText: 'Comment Mention' })

  const savedViews = page.getByRole('button', { name: /^Saved views/ })
  await savedViews.click()
  await expect(page.getByText('No saved views yet.')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Save current as…' })).toBeDisabled()
  await page.keyboard.press('Escape')

  await page.getByRole('combobox').filter({ hasText: 'Task' }).click()
  await page.getByRole('option', { name: `Task #${taskSet[0].id}` }).click()
  await expect(items).toHaveCount(1)

  await savedViews.click()
  await page.getByRole('menuitem', { name: 'Save current as…' }).click()
  await page.getByRole('textbox', { name: 'Saved view name' }).fill('First task')
  await page.getByRole('button', { name: 'Save view' }).click()
  await expect(page.getByText('Saved view "First task"')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Clear Filters' }).click()
  await expect(items).toHaveCount(2)

  await page.reload()
  await expect(items).toHaveCount(2, { timeout: 20_000 })
  await page.getByRole('button', { name: /^Saved views/ }).click()
  await page.getByRole('menuitem', { name: 'First task' }).click()
  await expect(page.getByText('Applied view "First task"')).toBeVisible()
  await expect(items).toHaveCount(1)
  await expect(items).toContainText(`Task #${taskSet[0].id}`)

  await page.getByRole('button', { name: /^Saved views/ }).click()
  await page.getByRole('button', { name: 'Rename First task' }).click()
  await page.getByRole('textbox', { name: 'Rename saved view' }).fill('Only task one')
  await page.getByRole('button', { name: 'Save name' }).click()
  await expect(page.getByText('View renamed')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Only task one' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete Only task one' }).click()
  await expect(page.getByText('View deleted')).toBeVisible()
  await expect(page.getByText('No saved views yet.')).toBeVisible()
})
