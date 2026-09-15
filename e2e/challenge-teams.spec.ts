import { BACKEND_URL, expect, giveChallengeToTeam, SUPER_KEY, test } from './fixtures'

// Handing a challenge to a team: the team becomes its byline and the team's
// image goes on its card.

test('a challenge is credited to the team that owns it, not its creator', async ({
  page,
  request,
  team,
  challenge,
}) => {
  await giveChallengeToTeam(request, challenge.id, team.id)

  await page.goto(`/challenge/${challenge.id}`)
  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({
    timeout: 15_000,
  })

  // The byline names the team and links to it, rather than linking the
  // creator off to their OpenStreetMap profile.
  const teamLink = page.getByRole('link', { name: team.name })
  await expect(teamLink).toBeVisible({ timeout: 15_000 })
  await expect(teamLink).toHaveAttribute('href', `/teams/${team.id}`)
})

test('a challenge with no owning team is credited to a person', async ({ page, challenge }) => {
  await page.goto(`/challenge/${challenge.id}`)
  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({
    timeout: 15_000,
  })

  // No team link, because no team owns it.
  await expect(page.getByRole('link', { name: /^\/teams\// })).toHaveCount(0)
})

test('the challenge form offers the teams the user runs, and No team', async ({
  page,
  challenge,
  team,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}/edit`)

  const noTeam = page.getByRole('button', { name: /No team/ })
  await expect(noTeam).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: new RegExp(team.name) })).toBeVisible()

  // With no team chosen, No team is the selected tile.
  await expect(noTeam).toHaveAttribute('aria-pressed', 'true')
})

test('choosing a team on the form gives the challenge to that team', async ({
  page,
  request,
  challenge,
  team,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}/edit`)

  const teamTile = page.getByRole('button', { name: new RegExp(team.name) })
  await expect(teamTile).toBeVisible({ timeout: 20_000 })
  await teamTile.click()
  await expect(teamTile).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Update Challenge' }).click()

  // The form's own round trip is what matters here: read the challenge back
  // rather than trusting the page it navigates to.
  await expect(async () => {
    const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${challenge.id}`, {
      headers: { apiKey: SUPER_KEY },
    })
    const body = (await response.json()) as { ownerTeamId?: number | null }
    expect(body.ownerTeamId).toBe(team.id)
  }).toPass({ timeout: 20_000 })
})

test('a team-owned challenge appears on that team page and can be handed back', async ({
  page,
  request,
  challenge,
  team,
}) => {
  await giveChallengeToTeam(request, challenge.id, team.id)
  await page.goto(`/teams/${team.id}?section=challenges`)
  await expect(page.getByRole('link', { name: new RegExp(challenge.name) })).toBeVisible({
    timeout: 15_000,
  })

  await giveChallengeToTeam(request, challenge.id, null)
  await page.goto(`/teams/${team.id}?section=challenges`)
  await expect(page.getByText('No challenges')).toBeVisible({ timeout: 15_000 })
})
