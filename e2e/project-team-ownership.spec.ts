import type { Project } from '@/types/Project'
import { BACKEND_URL, expect, test } from './fixtures'

// Giving a project to a team from the project form, the same way a challenge
// is handed over. Ownership is singular and is what puts the team's image on
// the project's card -- distinct from attaching a team, which is one of
// several helping run it.

test('choosing a team instead of No team on the form gives the project to that team', async ({
  page,
  project,
  team,
  request,
}) => {
  await page.goto(`/manage/project/${project.id}/edit`)
  await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible({ timeout: 15_000 })

  await expect(page.getByRole('button', { name: 'No team' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  const teamTile = page.getByRole('button', { name: new RegExp(team.name) })
  await teamTile.click()
  await expect(teamTile).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Update Project' }).click()
  await expect(page).toHaveURL(`/manage/project/${project.id}`, { timeout: 15_000 })

  // The server is the authority on whether ownership actually took.
  const response = await request.get(`${BACKEND_URL}/api/v2/project/${project.id}`)
  const body = (await response.json()) as Project
  expect(body.ownerTeamId).toBe(team.id)
  expect(body.avatarUrl).toBe(`/api/v2/team/${team.id}/image/file`)
})

test('a project can be handed back from a team', async ({ page, project, team, request }) => {
  await page.goto(`/manage/project/${project.id}/edit`)
  await page.getByRole('button', { name: new RegExp(team.name) }).click()
  await page.getByRole('button', { name: 'Update Project' }).click()
  await expect(page).toHaveURL(`/manage/project/${project.id}`, { timeout: 15_000 })

  await page.goto(`/manage/project/${project.id}/edit`)
  await page.getByRole('button', { name: 'No team' }).click()
  await page.getByRole('button', { name: 'Update Project' }).click()
  await expect(page).toHaveURL(`/manage/project/${project.id}`, { timeout: 15_000 })

  const response = await request.get(`${BACKEND_URL}/api/v2/project/${project.id}`)
  const body = (await response.json()) as Project
  expect(body.ownerTeamId ?? null).toBeNull()
  // No owning team means no picture at all, rather than a url that 404s.
  expect(body.avatarUrl).toBeUndefined()
})
