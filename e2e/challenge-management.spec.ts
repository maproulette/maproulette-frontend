import { expect, test } from './fixtures'

test('a user can edit an existing challenge and see the changes persisted', async ({
  page,
  challenge,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}/edit`)

  const heading = page.getByRole('heading', { name: 'Challenge Editor' })
  await expect(heading).toBeVisible({ timeout: 15_000 })

  const nameField = page.getByLabel('Name')
  // The form is populated asynchronously once the challenge query resolves.
  await expect(nameField).toHaveValue(challenge.name, { timeout: 15_000 })

  const updatedName = `${challenge.name} (edited)`
  const updatedDescription = 'Updated by the challenge-management E2E test.'

  await nameField.fill(updatedName)
  await page.getByLabel('Description').fill(updatedDescription)

  await page.getByRole('button', { name: 'Update Challenge' }).click()

  await expect(page).toHaveURL(new RegExp(`/manage/challenge/${challenge.id}$`), {
    timeout: 30_000,
  })
  // The updated name renders in both a top toolbar heading and the page's
  // main heading; either confirms the edit persisted and reloaded correctly.
  await expect(page.getByRole('heading', { name: updatedName }).first()).toBeVisible({
    timeout: 15_000,
  })

  await page.getByRole('button', { name: 'Description' }).click()
  await expect(page.getByRole('dialog')).toContainText(updatedDescription)
})

test('a user can archive an existing challenge and see it flagged as archived', async ({
  page,
  challenge,
}) => {
  await page.goto(`/manage/project/${challenge.projectId}`)

  await expect(page.getByText(challenge.name)).toBeVisible({ timeout: 20_000 })

  // The table view keeps row actions in their own cell (rather than nested
  // inside the challenge's link, as in grid/card view), so switch to it.
  await page.getByRole('radio', { name: 'List view' }).click()

  const row = page.getByRole('row', { name: challenge.name })
  await expect(row).toBeVisible({ timeout: 15_000 })

  await row.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Archive challenge' }).click()

  // Once the archive mutation resolves and the challenge list is refetched,
  // the same menu item is relabeled to offer the reverse action.
  await row.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('menuitem', { name: 'Unarchive challenge' })).toBeVisible({
    timeout: 15_000,
  })
  await page.keyboard.press('Escape')

  // The "Archived" filter only shows challenges with isArchived set, so the
  // challenge remaining visible after switching it on confirms the archived
  // state took effect server-side, not just in the dropdown label.
  await page.getByRole('button', { name: 'Archived', exact: true }).click()
  await expect(row).toBeVisible({ timeout: 15_000 })
})
