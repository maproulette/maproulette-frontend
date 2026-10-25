import { expect, test } from './fixtures'

// Note: this test does NOT reload the page to verify the setting survived a
// fresh fetch, nor does it read/restore the user's settings via the backend
// API afterward (an earlier version of this test did both, via direct calls
// to GET/PUT /api/v2/user in the spec body — a black-box-testing violation
// per TESTING.md, since E2E tests must only observe the UI, not inspect the
// backend directly). What this does prove: submitting the form calls the real update mutation
// (confirmed via the success toast, which only fires in the mutation's
// resolved `.then`), and the query cache it seeds keeps the saved value
// showing in the UI immediately afterward, without a reload.
test('a user can update their custom basemap URL setting', async ({ page }) => {
  const newBasemapUrl = `https://example.com/tiles/${Date.now()}/{z}/{x}/{y}.png`

  await page.goto('/settings')

  const basemapUrlField = page.getByLabel('Custom Basemap URL')
  await expect(basemapUrlField).toBeVisible({ timeout: 15_000 })

  await basemapUrlField.fill(newBasemapUrl)

  const submit = page.getByRole('button', { name: 'Save Changes' })
  await submit.click()

  await expect(page.getByText('User settings updated')).toBeVisible({ timeout: 15_000 })
  await expect(basemapUrlField).toHaveValue(newBasemapUrl)
})
