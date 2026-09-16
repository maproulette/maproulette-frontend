import { BACKEND_URL, expect, SUPER_KEY, test } from './fixtures'

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
    `${BACKEND_URL}/api/v2/team/${teamId}/challenge/${challengeId}/2`,
    { headers: { apiKey: SUPER_KEY } }
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

test('a challenge with no teams says so, and offers the add control', async ({
  page,
  challenge,
}) => {
  const dialog = await openManagers(page, challenge.id)

  await expect(dialog.getByRole('heading', { name: 'Teams', exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expect(dialog.getByText('No teams yet.')).toBeVisible()
  await expect(dialog.getByLabel('Add a team')).toBeVisible()
})

test('the Teams section says what a team confers, rather than offering a role', async ({
  page,
  challenge,
  team,
  request,
}) => {
  await attachTeamToChallenge(request, team.id, challenge.id)
  const dialog = await openManagers(page, challenge.id)

  await expect(dialog.getByText(team.name)).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByText(/follows their role in the team/i)).toBeVisible()

  const teamRow = dialog.locator('li').filter({ hasText: team.name })
  await expect(teamRow.getByRole('combobox')).toHaveCount(0)
})

test('a team can be found by name and attached to the challenge', async ({
  page,
  challenge,
  team,
}) => {
  const dialog = await openManagers(page, challenge.id)
  await expect(dialog.getByText('No teams yet.')).toBeVisible({ timeout: 15_000 })

  await dialog.getByLabel('Add a team').fill(team.name)
  await dialog.getByRole('button', { name: team.name }).click()

  await expect(dialog.getByText('No teams yet.')).not.toBeVisible({ timeout: 15_000 })
  await expect(dialog.locator('li').filter({ hasText: team.name })).toBeVisible()
})

test('an attached team can be detached again', async ({ page, challenge, team, request }) => {
  await attachTeamToChallenge(request, team.id, challenge.id)
  const dialog = await openManagers(page, challenge.id)

  const teamRow = dialog.locator('li').filter({ hasText: team.name })
  await expect(teamRow).toBeVisible({ timeout: 15_000 })

  await teamRow.getByRole('button', { name: `Remove ${team.name}` }).click()

  await expect(dialog.getByText('No teams yet.')).toBeVisible({ timeout: 15_000 })
})

test('attaching a team to a challenge leaves its project alone', async ({
  page,
  challenge,
  team,
  request,
}) => {
  await attachTeamToChallenge(request, team.id, challenge.id)

  // Reaching one challenge is the whole point of granting here rather than on
  // the project, so the project must not pick the team up.
  const response = await request.get(
    `${BACKEND_URL}/api/v2/teams/projectManagers/${challenge.projectId}`,
    { headers: { apiKey: SUPER_KEY } }
  )
  const body = (await response.json()) as Array<{ team: { id: number } }>
  expect(body.some((entry) => entry.team.id === team.id)).toBe(false)

  const dialog = await openManagers(page, challenge.id)
  await expect(dialog.locator('li').filter({ hasText: team.name })).toBeVisible({ timeout: 15_000 })
})
