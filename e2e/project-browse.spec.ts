import { expect, test } from './fixtures'

// challenge-search.spec.ts stops at "the challenge shows up in the header
// search dropdown". This follows a search result through to the page it links
// to — the public project page, which otherwise has no coverage at all.
test('a user can search for a project and browse to its challenge list', async ({
  page,
  project,
  challenge,
}) => {
  test.setTimeout(60_000)

  await page.goto('/')

  const searchInput = page.getByRole('combobox', { name: /search challenges and projects/i })
  await searchInput.click()
  await searchInput.fill(project.name)

  const projectResult = page
    .getByRole('group', { name: 'Projects' })
    .getByRole('option', { name: project.name })
  await expect(projectResult).toBeVisible({ timeout: 15_000 })
  await projectResult.click()

  await expect(page).toHaveURL(new RegExp(`/project/${project.id}`), { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: project.name })).toBeVisible({ timeout: 20_000 })

  // The project page lists the challenges it contains, and each links onward
  // to that challenge's own page.
  const challengeLink = page.getByRole('link', { name: new RegExp(challenge.name) })
  await expect(challengeLink.first()).toBeVisible({ timeout: 20_000 })
  await challengeLink.first().click()

  await expect(page).toHaveURL(new RegExp(`/challenge/${challenge.id}`), { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({ timeout: 20_000 })
})
