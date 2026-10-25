import { BACKEND_URL, expect, test } from './fixtures'

interface WhoamiUser {
  id: number
  osmProfile: {
    displayName: string
  }
}

test('the super-admin users page lists the real authenticated user from the backend', async ({
  page,
  request,
}) => {
  // The whole browser session runs as the harness's seeded super user (see
  // e2e/global-setup.ts), so it's a genuine row the super-admin users list must
  // render from the database.
  const whoamiResponse = await request.get(`${BACKEND_URL}/api/v2/user/whoami`)
  expect(whoamiResponse.ok()).toBeTruthy()
  const currentUser = (await whoamiResponse.json()) as WhoamiUser

  await page.goto('/super-admin/users')

  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({
    timeout: 15_000,
  })

  const userRow = page.getByRole('row', { name: currentUser.osmProfile.displayName })
  await expect(userRow).toBeVisible({ timeout: 15_000 })
  await expect(userRow.getByText(`ID: ${currentUser.id}`)).toBeVisible()
  await expect(userRow.getByText('super admin')).toBeVisible()

  const searchInput = page.getByPlaceholder('Search users by name or email...')

  // Filtering by the real display name keeps the row visible.
  await searchInput.fill(currentUser.osmProfile.displayName)
  await expect(userRow).toBeVisible()

  // An unmatched search filters the row out and shows the empty state.
  await searchInput.fill('no-such-user-xyz-123')
  await expect(userRow).not.toBeVisible()
  await expect(page.getByText('No users found')).toBeVisible({ timeout: 15_000 })
})
