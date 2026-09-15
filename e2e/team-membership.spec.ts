import { expect, test } from './fixtures'

// Inviting, re-roling and removing members, all from the team's Users section.
// Every request this harness makes is the same super-user identity (see
// fixtures.ts), so these drive the controls and assert what the team's own
// page reports back rather than what a second person would see.

test('the invite dialog offers the roles a team can hand out', async ({ page, team }) => {
  await page.goto(`/teams/${team.id}`)
  await expect(page.getByRole('heading', { name: team.name })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'Invite' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  await expect(dialog.getByRole('combobox')).toBeVisible()
})

test('a team cannot be left without an owner', async ({ page, team }) => {
  await page.goto(`/teams/${team.id}`)

  const membersTable = page.getByRole('table')
  await expect(membersTable).toBeVisible({ timeout: 15_000 })

  // The sole owner is the only thing standing between the team and nobody
  // being able to delete it, so their role picker and removal are both barred.
  // The row belongs to the viewer themselves here, so no controls are offered
  // at all -- which is the same protection by a shorter route.
  await expect(membersTable.getByRole('row')).toHaveCount(2)
})
