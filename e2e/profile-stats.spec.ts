import type { APIRequestContext } from '@playwright/test'
import { BACKEND_URL, newSessionRequest } from './fixtures'
import { expect, test } from './helpers/misc'

const complete = async (request: APIRequestContext, taskId: number, status: number) => {
  expect((await request.get(`${BACKEND_URL}/api/v2/task/${taskId}/start`)).ok()).toBe(true)
  expect((await request.put(`${BACKEND_URL}/api/v2/task/${taskId}/${status}`)).ok()).toBe(true)
}

test('a mapper earns points for the tasks they finish, and others can see their profile', async ({
  page,
  playwright,
  taskSet,
  member,
  memberPage,
}) => {
  await memberPage.goto('/profile')
  await expect(memberPage.getByRole('heading', { name: member.name, level: 1 })).toBeVisible({
    timeout: 20_000,
  })
  await expect(memberPage.getByText('0 points')).toBeVisible()

  const memberRequest = await newSessionRequest(playwright.request, member)
  await complete(memberRequest, taskSet[0].id, 1)
  await complete(memberRequest, taskSet[1].id, 1)
  await complete(memberRequest, taskSet[2].id, 5)
  await memberRequest.dispose()

  await memberPage.reload()
  await expect(memberPage.getByText('13 points')).toBeVisible({ timeout: 20_000 })

  await expect(memberPage.getByText('3 tasks')).toBeAttached()
  const count = (label: string) =>
    memberPage
      .getByRole('term')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator('+ dd')
  await expect(count('Fixed')).toHaveText('2')
  await expect(count('Already Fixed')).toHaveText('1')
  await expect(count('Not an Issue')).toHaveText('0')
  await expect(count("Can't Complete")).toHaveText('0')
  await expect(async () => {
    await memberPage.reload()
    await expect(memberPage.getByRole('button', { name: 'First Fix', exact: true })).toBeVisible({
      timeout: 5_000,
    })
  }).toPass({ timeout: 30_000 })
  await expect(
    memberPage.getByRole('button', { name: 'Challenge Champion', exact: true })
  ).toBeVisible()
  await expect(memberPage.getByRole('button', { name: '100 Points (locked)' })).toBeVisible()
  await expect(memberPage.getByRole('button', { name: '500 Points (locked)' })).toBeVisible()

  await page.goto(`/profile/${member.id}`)
  await expect(page.getByRole('heading', { name: member.name, level: 1 })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByRole('link', { name: 'OSM Profile' })).toHaveAttribute(
    'href',
    `https://www.openstreetmap.org/user/${member.name}`
  )
  await expect(page.getByText('13 points')).not.toBeVisible()
})
