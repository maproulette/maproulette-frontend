import type { UserWhoamiResponse } from '@/types/User'
import { BACKEND_URL, expect, test } from './fixtures'

test('the super-admin users page lists the real authenticated user from the backend', async ({
  page,
  request,
}) => {
  // The whole browser session runs as the harness's seeded super user (see
  // e2e/global-setup.ts), so it's a genuine row the super-admin users list must
  // render from the database.
  const whoamiResponse = await request.get(`${BACKEND_URL}/api/v2/user/whoami`)
  expect(whoamiResponse.ok()).toBeTruthy()
  const currentUser = (await whoamiResponse.json()) as UserWhoamiResponse

  await page.goto('/super-admin/users')

  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({
    timeout: 15_000,
  })

  const userRow = page.getByRole('row', { name: currentUser.osmProfile.displayName })
  await expect(userRow).toBeVisible({ timeout: 15_000 })
  await expect(userRow.getByText(`ID: ${currentUser.id}`)).toBeVisible()
  await expect(userRow.getByText('super admin')).toBeVisible()
})
