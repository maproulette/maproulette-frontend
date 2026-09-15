import { expect, giveChallengeToTeam, grantTeamProjectRole, test } from './fixtures'

// The team detail page is split: the team itself on the left, and what the
// team has on the right under Users / Projects / Challenges.

test('a team page shows the team on the left and its sections on the right', async ({
  page,
  team,
}) => {
  await page.goto(`/teams/${team.id}`)

  // Left panel: who the team is, and what a manager can do to it.
  await expect(page.getByRole('heading', { name: team.name })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('1 member')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Invite' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Challenge image' })).toBeVisible()

  // Right panel: the three sections, with Users showing by default.
  await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Projects' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Challenges' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Users' })).toHaveAttribute('data-state', 'active')
})

test('the members table lists the creator with their role', async ({ page, team }) => {
  await page.goto(`/teams/${team.id}`)

  const membersTable = page.getByRole('table')
  await expect(membersTable).toBeVisible({ timeout: 15_000 })
  await expect(membersTable.getByRole('columnheader', { name: 'Name' })).toBeVisible()
  await expect(membersTable.getByRole('columnheader', { name: 'Role' })).toBeVisible()
  await expect(membersTable.getByRole('columnheader', { name: 'Status' })).toBeVisible()

  // The creator is a joined Owner, not a pending invitation to themselves.
  await expect(membersTable.getByRole('row')).toHaveCount(2)
  await expect(membersTable.getByText('Joined')).toBeVisible()
})

test('the chosen section is kept in the url so it survives a reload', async ({ page, team }) => {
  await page.goto(`/teams/${team.id}`)

  await page.getByRole('tab', { name: 'Challenges' }).click()
  await expect(page).toHaveURL(/section=challenges/, { timeout: 10_000 })

  await page.reload()
  await expect(page.getByRole('tab', { name: 'Challenges' })).toHaveAttribute(
    'data-state',
    'active',
    { timeout: 15_000 }
  )
})

test('a challenge given to a team shows up in its Challenges section', async ({
  page,
  request,
  team,
  challenge,
}) => {
  await giveChallengeToTeam(request, challenge.id, team.id)

  await page.goto(`/teams/${team.id}?section=challenges`)
  await expect(page.getByRole('link', { name: new RegExp(challenge.name) })).toBeVisible({
    timeout: 15_000,
  })
})

test('a team with no challenges says so rather than showing an empty grid', async ({
  page,
  team,
}) => {
  await page.goto(`/teams/${team.id}?section=challenges`)
  await expect(page.getByText('No challenges')).toBeVisible({ timeout: 15_000 })
})

test('a project the team manages shows up in its Projects section', async ({
  page,
  request,
  team,
  project,
}) => {
  await grantTeamProjectRole(request, team.id, project.id)

  await page.goto(`/teams/${team.id}?section=projects`)
  await expect(page.getByRole('link', { name: new RegExp(project.name) })).toBeVisible({
    timeout: 15_000,
  })
})

test('a team that manages no project says so', async ({ page, team }) => {
  await page.goto(`/teams/${team.id}?section=projects`)
  await expect(page.getByText('No projects')).toBeVisible({ timeout: 15_000 })
})
