import { expect, test } from './fixtures'

// Projects are the level above challenges, and the whole lifecycle runs
// through the UI here (rather than from a fixture) precisely because creating
// and deleting a project is the thing under test.
test('a user can create, edit and delete a project through the management UI', async ({ page }) => {
  test.setTimeout(90_000)

  const name = `e2e-ui-project-${Date.now()}`
  const displayName = `E2E UI Project ${Date.now()}`
  const updatedDisplayName = `${displayName} (edited)`

  await page.goto('/manage/project/new')

  await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible({
    timeout: 15_000,
  })

  await page.getByLabel('Project Name').fill(name)
  await page.getByLabel('Display Name').fill(displayName)
  await page.getByLabel('Description').fill('Created by the project-management E2E test.')

  await page.getByRole('button', { name: 'Create Project' }).click()

  await expect(page.getByText('Project created successfully')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(/\/manage\/project\/\d+$/, { timeout: 30_000 })

  // The detail page identifies a project by its display name, so seeing it
  // here confirms the create request carried both names, not just `name`. It
  // renders in both a top toolbar heading and the sidebar heading; either
  // confirms the project was created and reloaded.
  await expect(page.getByRole('heading', { name: displayName }).first()).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Created by the project-management E2E test.')).toBeVisible()

  await page.getByRole('button', { name: 'Edit project' }).click()

  // Scoped by level because the form's own "Project details" section heading
  // otherwise matches this case-insensitively too.
  await expect(page.getByRole('heading', { level: 2, name: 'Project Details' })).toBeVisible({
    timeout: 15_000,
  })
  // The form is populated asynchronously once the project query resolves.
  await expect(page.getByLabel('Project Name')).toHaveValue(name, { timeout: 15_000 })

  await page.getByLabel('Display Name').fill(updatedDisplayName)
  await page.getByRole('button', { name: 'Update Project' }).click()

  await expect(page.getByText('Project updated successfully')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(/\/manage\/project\/\d+$/, { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: updatedDisplayName }).first()).toBeVisible({
    timeout: 15_000,
  })

  // The new project shows up in the management list, linking to the detail
  // page it was just edited on.
  const projectUrl = page.url()

  await page.goto('/manage/projects')
  await expect(page.getByRole('heading', { name: 'Manage Projects' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(
    page.getByRole('link', { name: new RegExp(updatedDisplayName.replace(/[()]/g, '\\$&')) })
  ).toBeVisible({ timeout: 15_000 })

  await page.goto(projectUrl)
  await expect(page.getByRole('heading', { name: updatedDisplayName }).first()).toBeVisible({
    timeout: 15_000,
  })

  await page.getByRole('button', { name: 'Delete project' }).click()
  await expect(page.getByRole('heading', { name: 'Delete project?' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  // Returning to the list is what the delete mutation does on success, so
  // arriving there is the confirmation that the delete request went through.
  // Nothing further is asserted about the project being gone: a plain DELETE
  // only *schedules* the deletion on the backend (the fixtures' teardown
  // passes `?immediate=true` to avoid this), so for a while afterwards the
  // project is still listed and its pages still load — there is no
  // UI-observable "it's gone" state to wait for here.
  await expect(page).toHaveURL('/manage/projects', { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Manage Projects' })).toBeVisible({
    timeout: 15_000,
  })
})
