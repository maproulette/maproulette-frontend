import { BACKEND_URL, expect, SUPER_KEY, test } from './fixtures'

// Granting an individual user a role on a single challenge, which reaches
// where the parent project's grants do not.
//
// The person being granted a role is seeded straight into the database (see
// seedUser in fixtures.ts): the backend has no endpoint that creates users, so
// there would otherwise be nobody to grant to. They are only ever the target
// here, never the actor -- this harness cannot authenticate as them, so what a
// grant actually lets them *do* is covered in the backend's
// ChallengeServiceSpec rather than through the browser.

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

test('a user can be added as a manager and shows up with their role', async ({
  page,
  challenge,
  seededUser,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByText('No managers yet.')).toBeVisible({ timeout: 15_000 })

  await dialog.getByLabel('Add a manager').fill(seededUser.name)
  await dialog.getByRole('button', { name: seededUser.name }).click()

  // The toast is portalled to the app root, so it is not inside the dialog.
  await expect(page.getByText(`${seededUser.name} can now manage this challenge`)).toBeVisible({
    timeout: 15_000,
  })
  await expect(dialog.getByText('No managers yet.')).toBeHidden()

  // The row is the real outcome: they are listed, with the role that was
  // chosen before they were added (Write is the panel's default).
  const row = dialog.locator('li').filter({ hasText: seededUser.name })
  await expect(row).toBeVisible()
  await expect(row.getByRole('combobox')).toContainText('Write')
})

test("a manager's role can be changed, and they keep just the one", async ({
  page,
  request,
  challenge,
  seededUser,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await dialog.getByLabel('Add a manager').fill(seededUser.name)
  await dialog.getByRole('button', { name: seededUser.name }).click()
  await expect(dialog.getByText(seededUser.name, { exact: true })).toBeVisible({ timeout: 15_000 })

  // The row's own role picker, not the one that sits next to the search box.
  const row = dialog.locator('li').filter({ hasText: seededUser.name })
  await row.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Admin' }).click()

  // A user holds one role per challenge: re-granting replaces rather than
  // accumulates, so the server should report exactly one entry.
  await expect(async () => {
    const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${challenge.id}/managers`, {
      headers: { apiKey: SUPER_KEY },
    })
    const managers = (await response.json()) as Array<{ userId: number; role: number }>
    expect(managers).toHaveLength(1)
    expect(managers[0]).toMatchObject({ userId: seededUser.id, role: 1 })
  }).toPass({ timeout: 20_000 })
})

test('a manager can be removed again', async ({ page, request, challenge, seededUser }) => {
  await page.goto(`/manage/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await dialog.getByLabel('Add a manager').fill(seededUser.name)
  await dialog.getByRole('button', { name: seededUser.name }).click()
  await expect(dialog.getByText(seededUser.name, { exact: true })).toBeVisible({ timeout: 15_000 })

  await dialog.getByRole('button', { name: `Remove ${seededUser.name}` }).click()

  await expect(dialog.getByText('No managers yet.')).toBeVisible({ timeout: 15_000 })
  await expect(async () => {
    const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${challenge.id}/managers`, {
      headers: { apiKey: SUPER_KEY },
    })
    expect(await response.json()).toEqual([])
  }).toPass({ timeout: 20_000 })
})
