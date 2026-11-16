import { expect, giveChallengeToTeam, test } from './fixtures'

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

  await expect(
    page.locator('a[href="https://www.openstreetmap.org/user/e2e-super-user"]')
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('a[href^="/teams/"]')).toHaveCount(0)
})
