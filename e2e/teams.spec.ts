import { expect, test } from './fixtures'

test('a user can create a team, see it on the dashboard, and delete it', async ({ page }) => {
  const teamName = `e2e-team-${Date.now()}`

  // Teams are managed from the dashboard's Teams section — there is no
  // separate teams list page.
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Teams' })).toBeVisible({ timeout: 15_000 })

  await page.getByRole('link', { name: 'Create team' }).click()
  await expect(page).toHaveURL('/teams/new')

  await page.getByLabel('Name').fill(teamName)
  await page.getByLabel('Description').fill('Created by the teams E2E test.')
  await page.getByRole('button', { name: 'Create team' }).click()

  // Successful creation navigates to the new team's detail page. The creator
  // is shown as an active Admin member, not a pending invite to themselves.
  await expect(page).toHaveURL(/\/teams\/\d+$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: teamName })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('1 member')).toBeVisible()

  // The team shows up back on the dashboard as a card linking to its detail
  // page, showing its real name and the creator's Admin role (not the
  // creator's own name).
  await page.goto('/dashboard')
  const teamLink = page.getByRole('link', { name: new RegExp(`${teamName}.*Admin`) })
  await expect(teamLink).toBeVisible({ timeout: 15_000 })

  // Clean up: delete the team from its detail page.
  await teamLink.click()
  await expect(page).toHaveURL(/\/teams\/\d+$/, { timeout: 15_000 })
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Delete this team?' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Delete team' }).click()

  await expect(page).toHaveURL('/dashboard', { timeout: 15_000 })
  await expect(teamLink).not.toBeVisible()
})
