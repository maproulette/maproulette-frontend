import { BACKEND_URL, expect, SUPER_KEY, test } from './fixtures'

interface WhoamiUser {
  id: number
  osmProfile: {
    displayName: string
  }
}

// Skipped: the test harness authenticates every request as a synthetic
// backend user (id -999) via the MR_SUPER_KEY apiKey header. That grants the
// backend API full access, and PUT /superuser/-999 does add it to the
// /superusers list — but src/lib/SuperAdminGuard.tsx (the frontend's route
// guard for /super-admin/*) checks for a `grants` entry with role === -1,
// and whoami's `grants` array for this synthetic user stays empty regardless
// (confirmed: no exposed API grants a global role to it). So the frontend
// itself renders "Access Denied" for any /super-admin/* route in this
// environment, independent of anything in this repo — there's currently no
// way to represent a real super-admin-granted user without OSM OAuth or
// direct database access, neither of which the E2E harness uses.
//
// Substitute coverage: src/lib/SuperAdminGuard.test.ts unit-tests
// `isSuperUser` directly (the guard's actual access-control predicate) across
// null/undefined users and grants with/without role === -1, which is the one
// piece of /super-admin/* logic this repo can exercise without a real
// super-admin-granted identity. It does not cover the routed page/table
// behavior below (that remains genuinely untested pending either OSM OAuth
// support or DB-level seeding in the E2E harness).
test.skip('the super-admin users page lists the real authenticated user from the backend', async ({
  page,
  request,
}) => {
  // The whole browser session authenticates as this real backend user via the
  // apiKey header (see e2e/fixtures.ts / .env.test), so it's a genuine row the
  // super-admin users list must render from the database, not a fixture we set up.
  const whoamiResponse = await request.get(`${BACKEND_URL}/api/v2/user/whoami`, {
    headers: { apiKey: SUPER_KEY },
  })
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
