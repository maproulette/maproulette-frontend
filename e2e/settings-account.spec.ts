import type { APIRequestContext, Page } from '@playwright/test'
import type { UserWhoamiResponse } from '@/types/User'
import { BACKEND_URL, newSessionRequest, type TestUser } from './fixtures'
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

  await page.getByLabel('Custom Basemap URL').fill('https://example.com/{z}/{x}/{y}.png')
  await expect(submit).toBeEnabled()

  await page.getByLabel('Custom Basemap URL').fill('')
  await expect(submit).toBeDisabled()
})

test('the default editor and basemap are saved and shown again after a reload', async ({
  playwright,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)

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
  await memberRequest.dispose()
})

test('choosing a language saves it and switches the interface to it', async ({
  playwright,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)

  await page.goto('/settings')
  await expect(page.getByRole('tab', { name: 'General' })).toBeVisible({ timeout: 20_000 })

  await pick(page, 'Language', 'Deutsch')
  await save(page)

  expect((await storedSettings(memberRequest)).locale).toBe('de')

  await page.reload()
  await expect(page.getByRole('tab', { name: 'Allgemein' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('tab', { name: 'Nachrichten' })).toBeVisible()
  await memberRequest.dispose()
})

test('an invalid email is refused and a valid one is saved', async ({
  playwright,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)
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
  await memberRequest.dispose()
})

test('ignoring mentions is saved and stops mention notifications arriving', async ({
  playwright,
  request,
  taskSet,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)

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

  await page.goto('/notifications')
  await expect(page.getByRole('tab', { name: 'Unread (0)' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('tab', { name: 'All (0)' })).toBeVisible()
  await memberRequest.dispose()
})
