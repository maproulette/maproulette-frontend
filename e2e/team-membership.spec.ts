import {
  BACKEND_URL,
  createTeam,
  deleteTeam,
  expect,
  expectOk,
  superUser,
  test,
  uniqueName,
} from './fixtures'

// Inviting, re-roling and removing members, all from the team's Users section.
// Every request this harness makes is the same super-user identity (see
// fixtures.ts), so these drive the controls and assert what the team's own
// page reports back rather than what a second person would see.

test('a member can be invited with any role the team hands out', async ({
  page,
  team,
  seededUser,
}) => {
  await page.goto(`/teams/${team.id}`)
  await expect(page.getByRole('heading', { name: team.name })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'Invite' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  await dialog.getByPlaceholder('Search OSM username').fill(seededUser.name)
  await dialog.getByRole('button', { name: seededUser.name }).click()

  await dialog.getByRole('combobox').click()
  for (const role of ['Owner', 'Admin', 'Manager', 'Member']) {
    await expect(page.getByRole('option', { name: role, exact: true })).toBeVisible()
  }
  await page.getByRole('option', { name: 'Manager', exact: true }).click()
  await dialog.getByRole('button', { name: 'Send invitation' }).click()

  await expect(page.getByText('Invitation sent')).toBeVisible({ timeout: 15_000 })
  const row = page.getByRole('row').filter({ hasText: seededUser.name })
  await expect(row).toContainText('Invited', { timeout: 15_000 })
})

test("a team's last owner cannot be re-roled or removed", async ({
  page,
  request,
  mapperRequest,
}) => {
  const team = await createTeam(mapperRequest.request, uniqueName('e2e-owned'))

  try {
    await expectOk(
      await mapperRequest.request.post(
        `${BACKEND_URL}/api/v2/team/${team.id}/user/${superUser().id}/invite/1`
      ),
      'Inviting the super user'
    )
    await expectOk(
      await request.put(`${BACKEND_URL}/api/v2/team/${team.id}/invite/accept`),
      'Accepting the invite'
    )

    await page.goto(`/teams/${team.id}`)
    const ownerRow = page.getByRole('row').filter({ hasText: mapperRequest.user.name })
    await expect(ownerRow).toContainText('Owner', { timeout: 15_000 })
    await expect(ownerRow.getByRole('combobox', { name: 'Role' })).toBeDisabled()
    await expect(ownerRow.getByRole('button', { name: 'Remove member' })).toBeDisabled()
  } finally {
    await deleteTeam(mapperRequest.request, team.id)
  }
})
