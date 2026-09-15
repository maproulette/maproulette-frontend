import { expect, test } from './fixtures'

// Granting an individual user a role on a single challenge, which reaches
// where the parent project's grants do not.
//
// The grant itself cannot be driven from here. Adding a manager needs a second
// real user to grant to, and this harness has exactly one identity: every
// request carries MR_SUPER_KEY, which the backend maps to the synthetic
// User.superUser rather than to any row in the users table (see the REVIEWER_KEY
// comment in fixtures.ts, and `getSessionByApiKey` in the backend's
// SessionManager). There is no endpoint that creates a user either -- real
// users only ever arrive through the OSM OAuth callback -- so there is nobody
// to grant a role to. What the panel does before a grant exists is covered
// here; the grant, its role replacement, its revocation and the access it
// confers are covered in the backend's ChallengeServiceSpec.

test('the managers panel opens and reports that nobody has been granted a role', async ({
  page,
  challenge,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}`)

  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByRole('heading', { name: 'Challenge managers' })).toBeVisible()
  await expect(dialog.getByText('No managers yet.')).toBeVisible({ timeout: 15_000 })
})

test('the panel explains that project and team managers are not listed', async ({
  page,
  challenge,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByText(/already has access and is not listed here/)).toBeVisible()
})

test('searching for someone who does not exist says so', async ({ page, challenge }) => {
  await page.goto(`/manage/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })

  await dialog.getByLabel('Add a manager').fill('nobody-by-this-name-exists')
  await expect(dialog.getByText('No matching users')).toBeVisible({ timeout: 15_000 })
})

test('a role can be chosen before anyone is added', async ({ page, challenge }) => {
  await page.goto(`/manage/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })

  const roleSelect = dialog.getByRole('combobox')
  await expect(roleSelect).toBeVisible()
  await roleSelect.click()
  await expect(page.getByRole('option', { name: 'Admin' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('option', { name: 'Write' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Read' })).toBeVisible()
})
