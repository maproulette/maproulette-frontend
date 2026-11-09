import { BACKEND_URL, expect, projectTeamIds, test } from './fixtures'

// Attaching a team to a single challenge, which reaches that challenge alone
// without handing over the whole project. Users could always be granted a role
// here; teams had no equivalent at any layer until recently.
//
// As with the project side, there is no role to pick: what each member may do
// follows the role they hold in the team.

const attachTeamToChallenge = async (
  request: import('@playwright/test').APIRequestContext,
  teamId: number,
  challengeId: number
) => {
  const response = await request.post(
    `${BACKEND_URL}/api/v2/team/${teamId}/challenge/${challengeId}/2`
  )
  if (!response.ok()) {
    throw new Error(
      `Failed to attach team to challenge: ${response.status()} ${await response.text()}`
    )
  }
}

const openManagers = async (page: import('@playwright/test').Page, challengeId: number) => {
  await page.goto(`/manage/challenge/${challengeId}`)
  await page.getByRole('button', { name: 'Managers' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  return dialog
}

test('a team can be found by name and attached to the challenge, leaving its project alone', async ({
  page,
  challenge,
  team,
  request,
}) => {
  const dialog = await openManagers(page, challenge.id)
  await expect(dialog.getByText('No teams yet.')).toBeVisible({ timeout: 15_000 })

  await dialog.getByLabel('Add a team').fill(team.name)
  await dialog.getByRole('button', { name: team.name }).click()

  await expect(dialog.getByText('No teams yet.')).not.toBeVisible({ timeout: 15_000 })
  await expect(dialog.locator('li').filter({ hasText: team.name })).toBeVisible()

  expect(await projectTeamIds(request, challenge.projectId)).not.toContain(team.id)
})

test('an attached team can be detached again', async ({ page, challenge, team, request }) => {
  await attachTeamToChallenge(request, team.id, challenge.id)
  const dialog = await openManagers(page, challenge.id)

  const teamRow = dialog.locator('li').filter({ hasText: team.name })
  await expect(teamRow).toBeVisible({ timeout: 15_000 })
  await expect(teamRow.getByRole('combobox')).toHaveCount(0)

  await teamRow.getByRole('button', { name: `Remove ${team.name}` }).click()

  await expect(dialog.getByText('No teams yet.')).toBeVisible({ timeout: 15_000 })
})
