import type { APIRequestContext, Page } from '@playwright/test'
import type { UserWhoamiResponse } from '@/types/User'
import { BACKEND_URL, type TestUser } from './fixtures'
import { expect, test } from './helpers/misc'

const storedSettings = async (request: APIRequestContext) => {
  const response = await request.get(`${BACKEND_URL}/api/v2/user/whoami`)
  expect(response.ok()).toBe(true)
  return ((await response.json()) as UserWhoamiResponse).settings
}

const storedSubscriptions = async (request: APIRequestContext, user: TestUser) => {
  const response = await request.get(
    `${BACKEND_URL}/api/v2/user/${user.id}/notificationSubscriptions`
  )
  expect(response.ok()).toBe(true)
  return (await response.json()) as Record<string, number>
}

const pick = async (page: Page, label: string, option: string) => {
  await page.getByRole('combobox', { name: label }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

const save = async (page: Page) => {
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('User settings updated')).toBeVisible({ timeout: 15_000 })
}

test('the save button stays disabled until something changes', async ({ memberPage: page }) => {
  await page.goto('/settings')
  const submit = page.getByRole('button', { name: 'Save Changes' })
  await expect(submit).toBeDisabled({ timeout: 20_000 })

  const basemap = page.getByRole('combobox', { name: 'Default Basemap' })
  const original = (await basemap.textContent())?.trim() ?? ''

  await pick(page, 'Default Basemap', 'Custom tile layer…')
  await expect(submit).toBeEnabled()

  await pick(page, 'Default Basemap', original)
  await expect(submit).toBeDisabled()
})

test('the default editor and basemap are saved and shown again after a reload', async ({
  memberPage: page,
  memberRequest,
}) => {
  await page.goto('/settings')
  await expect(page.getByRole('combobox', { name: 'Default Editor' })).toBeVisible({
    timeout: 20_000,
  })

  await pick(page, 'Default Editor', 'Edit in JOSM')
  await pick(page, 'Default Basemap', 'Esri World Imagery')
  await save(page)

  const settings = await storedSettings(memberRequest)
  expect(settings.defaultEditor).toBe(1)
  expect(settings.defaultBasemapId).toBe('EsriWorldImagery')

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Default Editor' })).toHaveText('Edit in JOSM', {
    timeout: 20_000,
  })
  await expect(page.getByRole('combobox', { name: 'Default Basemap' })).toHaveText(
    'Esri World Imagery'
  )

  const customUrl = `https://example.com/tiles/${Date.now()}/{z}/{x}/{y}.png`
  await pick(page, 'Default Basemap', 'Custom tile layer…')
  await page.getByLabel('Custom Basemap URL').fill(customUrl)
  await save(page)
  expect((await storedSettings(memberRequest)).defaultBasemapId).toBe(customUrl)

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Default Basemap' })).toHaveText(
    'Custom tile layer…',
    { timeout: 20_000 }
  )
  await expect(page.getByLabel('Custom Basemap URL')).toHaveValue(customUrl)
})

test('an invalid email is refused and a valid one is saved', async ({
  member,
  memberPage: page,
  memberRequest,
}) => {
  const email = `${member.name}@example.com`

  await page.goto('/settings')
  await page.getByRole('tab', { name: 'Notifications' }).click({ timeout: 20_000 })

  const emailField = page.getByLabel('Email')
  await emailField.fill('not-an-email')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('User settings updated')).not.toBeVisible()
  expect(await emailField.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(
    true
  )
  expect((await storedSettings(memberRequest)).email ?? '').toBe('')

  await emailField.fill(email)
  await save(page)
  expect((await storedSettings(memberRequest)).email).toBe(email)

  await page.reload()
  await page.getByRole('tab', { name: 'Notifications' }).click({ timeout: 20_000 })
  await expect(page.getByLabel('Email')).toHaveValue(email)
})

test('ignoring mentions is saved and stops mention notifications arriving', async ({
  request,
  taskSet,
  member,
  memberPage: page,
  memberRequest,
}) => {
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'Notifications' }).click({ timeout: 20_000 })
  await expect(page.getByRole('combobox', { name: 'Mentions' })).toHaveText('Notify in app', {
    timeout: 20_000,
  })

  await pick(page, 'Mentions', 'Ignore')
  await pick(page, 'Teams', 'Notify and email immediately')
  await save(page)

  const subscriptions = await storedSubscriptions(memberRequest, member)
  expect(subscriptions.mention).toBe(0)
  expect(subscriptions.team).toBe(2)
  expect(subscriptions.challengeCompleted).toBe(1)
  expect(subscriptions.reviewApproved).toBe(1)

  const comment = await request.post(`${BACKEND_URL}/api/v2/task/${taskSet[0].id}/comment`, {
    data: { comment: `Ping @${member.name}` },
  })
  expect(comment.ok()).toBe(true)

  const notifications = await memberRequest.get(
    `${BACKEND_URL}/api/v2/user/${member.id}/notifications`
  )
  expect(notifications.ok()).toBe(true)
  expect(await notifications.json()).toEqual([])

  await page.goto('/notifications')
  await expect(page.getByText("You're all up to date")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('tab', { name: 'Unread (0)' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'All (0)' })).toBeVisible()
})
