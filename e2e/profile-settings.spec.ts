import { expect, test } from './fixtures'

// Note: this test does NOT reload the page to verify the setting survived a
// fresh fetch, nor does it read/restore the user's settings via the backend
// API afterward (an earlier version of this test did both, via direct calls
// to GET/PUT /api/v2/user in the spec body — a black-box-testing violation
// per TESTING.md, since E2E tests must only observe the UI, not inspect the
// backend directly). The test harness authenticates as a synthetic backend
// user (id -999, via the MR_SUPER_KEY apiKey header) that isn't a real
// persisted DB row — every GET /whoami synthesizes a fresh default user from
// scratch, so a reload always reports defaults regardless of any PUT that
// came before, for any field, and a "restore" PUT is a genuine no-op that
// nothing ever reads back. That's an inherent limitation of this synthetic
// identity, not something a real logged-in user would hit. What IS genuinely
// provable here: submitting the form calls the real update mutation
// (confirmed via the success toast, which only fires in the mutation's
// resolved `.then`), and the query cache it seeds keeps the saved value
// showing in the UI immediately afterward, without a reload.
test('a user can update their custom basemap URL setting', async ({ page }) => {
  const newBasemapUrl = `https://example.com/tiles/${Date.now()}/{z}/{x}/{y}.png`

  await page.goto('/settings')

  const basemapUrlField = page.getByLabel('Custom Basemap URL')
  await expect(basemapUrlField).toBeVisible({ timeout: 15_000 })

  await basemapUrlField.fill(newBasemapUrl)

  const submit = page.getByRole('button', { name: 'Submit' })
  await submit.click()

  await expect(page.getByText('User settings updated')).toBeVisible({ timeout: 15_000 })
  await expect(basemapUrlField).toHaveValue(newBasemapUrl)
})
