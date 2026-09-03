import { expect, test } from './fixtures'

// teams.spec.ts covers create-and-delete from the dashboard. This covers the
// separate edit route, which reads an existing team back into the form and
// saves it through a different mutation than creation.
test('a user can rename a team from its edit page', async ({ page, team }) => {
  const renamed = `${team.name}-renamed`

  await page.goto(`/teams/${team.id}/edit`)

  await expect(page.getByRole('heading', { name: 'Edit team' })).toBeVisible({ timeout: 15_000 })

  // The form is populated asynchronously once the team query resolves.
  const nameField = page.getByLabel('Name', { exact: true })
  await expect(nameField).toHaveValue(team.name, { timeout: 15_000 })

  await nameField.fill(renamed)
  await page.getByRole('textbox', { name: 'Description' }).fill('Renamed by the teams E2E test.')

  const save = page.getByRole('button', { name: 'Save' })
  await expect(save).toBeEnabled()
  await save.click()

  // Saving navigates to the team's detail page, which shows the new name.
  await expect(page.getByText('Team updated')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(new RegExp(`/teams/${team.id}$`), { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: renamed })).toBeVisible({ timeout: 15_000 })

  // Reopening the edit form reads the renamed team back from the server rather
  // than from the form state that submitted it.
  await page.goto(`/teams/${team.id}/edit`)
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(renamed, { timeout: 15_000 })
  await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue(
    'Renamed by the teams E2E test.'
  )
})
