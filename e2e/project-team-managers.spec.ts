import { expect, grantTeamProjectRole, test } from './fixtures'

// Attaching a team to a project, from the Managers and teams dialog.
//
// A team attached here confers access by the role each person holds *in the
// team* -- owners and admins administer, managers may edit, plain members get
// nothing -- so there is deliberately no role to pick. What that access lets
// someone actually do is covered by the backend's TeamAccessSpec: this harness
// authenticates as one identity and cannot act as a second person.

const openManagers = async (page: import('@playwright/test').Page, projectId: number) => {
  await page.goto(`/manage/project/${projectId}`)
  await page.getByRole('button', { name: 'Managers and teams' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  return dialog
}

test('the managers dialog opens from the project sidebar', async ({ page, project }) => {
  const dialog = await openManagers(page, project.id)

  await expect(dialog.getByRole('heading', { name: 'Managers and teams' })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Project managers' })).toBeVisible()
})

test('a project with no teams says so, and still offers the add control', async ({
  page,
  project,
}) => {
  const dialog = await openManagers(page, project.id)

  // The Teams section renders whether or not there are any: hiding it when
  // empty would hide the only way to attach the first one.
  await expect(dialog.getByRole('heading', { name: 'Teams', exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expect(dialog.getByText('No teams yet.')).toBeVisible()
  await expect(dialog.getByLabel('Add a team')).toBeVisible()
})

test('the Teams section says what a team confers, rather than offering a role', async ({
  page,
  project,
  team,
  request,
}) => {
  await grantTeamProjectRole(request, team.id, project.id)
  const dialog = await openManagers(page, project.id)

  await expect(dialog.getByText(team.name)).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByText(/follows their role in the team/i)).toBeVisible()

  // The user rows keep their role dropdown; the team row must not have one,
  // since the value would not be read.
  const teamRow = dialog.locator('li').filter({ hasText: team.name })
  await expect(teamRow.getByRole('combobox')).toHaveCount(0)
})

test('a team can be found by name and attached to the project', async ({ page, project, team }) => {
  const dialog = await openManagers(page, project.id)
  await expect(dialog.getByText('No teams yet.')).toBeVisible({ timeout: 15_000 })

  // Searching sends `name=`, which is what the endpoint requires; the search
  // used to send `query=` and was rejected before it ran.
  await dialog.getByLabel('Add a team').fill(team.name)
  await dialog.getByRole('button', { name: team.name }).click()

  await expect(dialog.getByText('No teams yet.')).not.toBeVisible({ timeout: 15_000 })
  await expect(dialog.locator('li').filter({ hasText: team.name })).toBeVisible()
})

test('a team already attached is not offered again in the search results', async ({
  page,
  project,
  team,
  request,
}) => {
  await grantTeamProjectRole(request, team.id, project.id)
  const dialog = await openManagers(page, project.id)
  await expect(dialog.locator('li').filter({ hasText: team.name })).toBeVisible({ timeout: 15_000 })

  await dialog.getByLabel('Add a team').fill(team.name)

  // It is edited in the list above rather than added twice.
  await expect(dialog.getByText('No matching teams')).toBeVisible({ timeout: 15_000 })
})

test('an attached team can be detached again', async ({ page, project, team, request }) => {
  await grantTeamProjectRole(request, team.id, project.id)
  const dialog = await openManagers(page, project.id)

  const teamRow = dialog.locator('li').filter({ hasText: team.name })
  await expect(teamRow).toBeVisible({ timeout: 15_000 })

  await teamRow.getByRole('button', { name: `Remove ${team.name}` }).click()

  await expect(dialog.getByText('No teams yet.')).toBeVisible({ timeout: 15_000 })
})
