import type { Page } from '@playwright/test'
import { TASK_STATUS } from '@/lib/taskStatusProgressions'
import { createProject, deleteProject, expect, test } from './fixtures'
import { addChallenge, archiveChallenge, getProject, getProjectChallenges } from './helpers/project'

const { created, fixed, falsePositive, alreadyFixed, skipped } = TASK_STATUS

const stat = (page: Page, label: string) =>
  page.locator(
    `xpath=//*[normalize-space(text())='${label}'][not(ancestor::button)]/following-sibling::span[1]`
  )

test('the project sidebar counts challenges, discoverable challenges and tasks left', async ({
  page,
  project,
  request,
}) => {
  const open = await addChallenge(request, project.id, {
    statuses: [fixed, falsePositive, created, created],
  })
  const hidden = await addChallenge(request, project.id, {
    enabled: false,
    statuses: [created, alreadyFixed, skipped],
  })

  const stored = await getProjectChallenges(request, project.id)
  const remaining = Object.fromEntries(
    stored.map((challenge) => [challenge.id, challenge.completionMetrics.tasksRemaining])
  )
  expect(remaining[open.id]).toBe(2)
  const totalRemaining = remaining[open.id] + remaining[hidden.id]

  await page.goto(`/manage/project/${project.id}`)
  await expect(page.getByText(open.name)).toBeVisible({ timeout: 20_000 })

  await expect(stat(page, 'Challenges')).toHaveText('2')
  await expect(stat(page, 'Shown')).toHaveText('2')
  await expect(stat(page, 'Discoverable')).toHaveText('1')
  await expect(stat(page, 'Tasks remaining')).toHaveText(String(totalRemaining))

  await page.getByRole('radio', { name: 'List view' }).click()
  const openRow = page.getByRole('row', { name: new RegExp(open.name) })
  const hiddenRow = page.getByRole('row', { name: new RegExp(hidden.name) })
  await expect(openRow.getByRole('cell').nth(4)).toHaveText(String(open.id))
  await expect(openRow.getByRole('cell').nth(5)).toHaveText('Normal')
  await expect(openRow.getByRole('cell').nth(6)).toHaveText('2')
  await expect(openRow.getByRole('cell').nth(7)).toHaveText(`Description of ${open.name}`)
  await expect(hiddenRow.getByRole('cell').nth(6)).toHaveText(String(remaining[hidden.id]))
})

test('the challenge filters on a project narrow the list and the Shown count', async ({
  page,
  project,
  request,
}) => {
  const discoverable = await addChallenge(request, project.id, { statuses: [created] })
  const undiscoverable = await addChallenge(request, project.id, {
    enabled: false,
    statuses: [created],
  })
  const archived = await addChallenge(request, project.id, { statuses: [created] })
  await archiveChallenge(request, archived.id)

  await page.goto(`/manage/project/${project.id}`)
  await page.getByRole('radio', { name: 'List view' }).click()
  const row = (name: string) => page.getByRole('row', { name: new RegExp(name) })
  await expect(row(discoverable.name)).toBeVisible({ timeout: 20_000 })
  await expect(stat(page, 'Shown')).toHaveText('3')

  await page.getByRole('button', { name: 'Discoverable', exact: true }).click()
  await expect(row(undiscoverable.name)).toBeHidden()
  await expect(row(discoverable.name)).toBeVisible()
  await expect(row(archived.name)).toBeVisible()
  await expect(stat(page, 'Shown')).toHaveText('2')
  await expect(stat(page, 'Challenges')).toHaveText('3')
  await page.getByRole('button', { name: 'Discoverable', exact: true }).click()

  await page.getByRole('button', { name: 'Archived', exact: true }).click()
  await expect(row(archived.name)).toBeVisible()
  await expect(row(discoverable.name)).toBeHidden()
  await expect(row(undiscoverable.name)).toBeHidden()
  await expect(stat(page, 'Shown')).toHaveText('1')
  await page.getByRole('button', { name: 'Archived', exact: true }).click()

  await page.getByPlaceholder('Search challenges…').fill(undiscoverable.name)
  await expect(row(undiscoverable.name)).toBeVisible()
  await expect(row(discoverable.name)).toBeHidden()
  await expect(stat(page, 'Shown')).toHaveText('1')
})

test('disabling and enabling a project from its page is stored on the project', async ({
  page,
  project,
  request,
}) => {
  await page.goto(`/manage/project/${project.id}`)

  await page.getByRole('button', { name: 'Disable project' }).click()
  await expect(page.getByRole('button', { name: 'Enable project' })).toBeVisible({
    timeout: 15_000,
  })
  await expect.poll(async () => (await getProject(request, project.id)).enabled).toBe(false)

  await page.reload()
  await page.getByRole('button', { name: 'Enable project' }).click()
  await expect(page.getByRole('button', { name: 'Disable project' })).toBeVisible({
    timeout: 15_000,
  })
  await expect.poll(async () => (await getProject(request, project.id)).enabled).toBe(true)
})

test('archiving a project flags it as archived until it is unarchived', async ({
  page,
  project,
  request,
}) => {
  await page.goto(`/manage/project/${project.id}`)

  await page.getByRole('button', { name: 'Archive project' }).click()
  await expect(page.getByRole('button', { name: 'Unarchive project' })).toBeVisible({
    timeout: 15_000,
  })
  await expect.poll(async () => (await getProject(request, project.id)).isArchived).toBe(true)

  await page.reload()
  await expect(page.getByRole('listitem').filter({ hasText: /^Archived$/ })).toBeVisible({
    timeout: 15_000,
  })

  await page.goto(`/project/${project.id}`)
  await expect(page.getByRole('heading', { name: project.name })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByText('Archived', { exact: true }).first()).toBeVisible()

  await page.goto(`/manage/project/${project.id}`)
  await page.getByRole('button', { name: 'Unarchive project' }).click()
  await expect(page.getByRole('button', { name: 'Archive project' })).toBeVisible({
    timeout: 15_000,
  })
  await expect.poll(async () => (await getProject(request, project.id)).isArchived).toBe(false)
})

test('the public project page totals completion across its challenges', async ({
  page,
  project,
  request,
}) => {
  const halfDone = await addChallenge(request, project.id, {
    statuses: [fixed, falsePositive, created, created],
  })
  const finished = await addChallenge(request, project.id, { statuses: [fixed, alreadyFixed] })

  await page.goto(`/project/${project.id}`)
  await expect(page.getByRole('heading', { name: project.name })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByText(`ID ${project.id}`)).toBeVisible()
  await expect(page.getByText('E2E test project')).toBeVisible()

  await expect(page.getByText('67% complete')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('4 / 6')).toBeVisible()
  await expect(stat(page, 'Challenges')).toHaveText('2')
  await expect(stat(page, 'Tasks remaining')).toHaveText('2')

  await page.getByRole('radio', { name: 'List view' }).click()
  const row = (name: string) => page.getByRole('row', { name: new RegExp(name) })
  await expect(row(halfDone.name).getByRole('cell').nth(3)).toHaveText('4')
  await expect(row(halfDone.name).getByRole('cell').nth(4)).toHaveText('50%')
  await expect(row(finished.name).getByRole('cell').nth(4)).toHaveText('100%')

  await page.getByRole('button', { name: 'Show completed', exact: true }).click()
  await expect(row(finished.name)).toBeHidden()
  await expect(row(halfDone.name)).toBeVisible()

  await page.getByRole('button', { name: 'Show completed', exact: true }).click()
  await page.getByPlaceholder('Search challenges…').fill(finished.name)
  await expect(row(finished.name)).toBeVisible()
  await expect(row(halfDone.name)).toBeHidden()
})

test('the public project page links to managing the project', async ({ page, project }) => {
  await page.goto(`/project/${project.id}`)
  await page.getByRole('link', { name: 'Manage' }).click()

  await expect(page).toHaveURL(new RegExp(`/manage/project/${project.id}$`), { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Delete project' })).toBeVisible({
    timeout: 15_000,
  })
})

test('the manage projects list hides undiscoverable projects behind the Discoverable filter', async ({
  page,
  project,
  request,
}) => {
  const hiddenName = `e2e-hidden-project-${Date.now()}`
  const { id: hiddenId } = await createProject(request, {
    name: hiddenName,
    description: 'Hidden',
    enabled: false,
  })

  try {
    await page.goto('/manage/projects')
    await page.getByRole('radio', { name: 'List view' }).click()

    const row = (name: string) => page.getByRole('row', { name: new RegExp(name) })
    await expect(row(project.name)).toBeVisible({ timeout: 20_000 })
    await expect(row(hiddenName)).toBeVisible()
    await expect(row(project.name).getByRole('cell').nth(3)).toHaveText(String(project.id))
    await expect(row(project.name)).toContainText('E2E test project')

    await page.getByRole('button', { name: 'Discoverable', exact: true }).click()
    await expect(row(hiddenName)).toBeHidden({ timeout: 15_000 })
    await expect(row(project.name)).toBeVisible()
  } finally {
    await deleteProject(request, hiddenId)
  }
})

test('making a project not discoverable from the projects list is stored on it', async ({
  page,
  project,
  request,
}) => {
  await page.goto('/manage/projects')

  const card = page
    .locator('.stretched-link-container')
    .filter({ has: page.getByRole('link', { name: project.name, exact: true }) })
  await expect(card).toBeVisible({ timeout: 20_000 })
  await card.getByRole('button', { name: 'Make not discoverable' }).click()
  await expect.poll(async () => (await getProject(request, project.id)).enabled).toBe(false)
  await expect(card.getByRole('button', { name: 'Make discoverable' })).toBeVisible()

  await card.getByRole('button', { name: 'Make discoverable' }).click()
  await expect.poll(async () => (await getProject(request, project.id)).enabled).toBe(true)
})

test('pinning a project from the projects list is remembered across reloads', async ({
  page,
  project,
}) => {
  await page.goto('/manage/projects')
  await page.getByRole('radio', { name: 'List view' }).click()

  const row = page.getByRole('row', { name: new RegExp(project.name) })
  await expect(row).toBeVisible({ timeout: 20_000 })

  try {
    await row.getByRole('button', { name: 'Pin project' }).click()
    await expect(row.getByRole('button', { name: 'Unpin project' })).toBeVisible({
      timeout: 15_000,
    })

    await page.reload()
    await page.getByRole('radio', { name: 'List view' }).click()
    await expect(row.getByRole('button', { name: 'Unpin project' })).toBeVisible({
      timeout: 15_000,
    })
  } finally {
    const unpin = row.getByRole('button', { name: 'Unpin project' })
    if (await unpin.isVisible()) {
      await unpin.click()
      await expect(row.getByRole('button', { name: 'Pin project' })).toBeVisible({
        timeout: 15_000,
      })
    }
  }
})

test('deleting a project from its page schedules it for deletion', async ({ page, request }) => {
  const name = `e2e-delete-project-${Date.now()}`
  const { id } = await createProject(request, { name, description: 'To be deleted' })

  try {
    await page.goto(`/manage/project/${id}`)
    await page.getByRole('button', { name: 'Delete project' }).click()
    await expect(page.getByRole('heading', { name: 'Delete project?' })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'Delete project?' })).toBeHidden()
    expect((await getProject(request, id)).deleted).toBe(false)

    await page.getByRole('button', { name: 'Delete project' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page).toHaveURL('/manage/projects', { timeout: 30_000 })
    await expect.poll(async () => (await getProject(request, id)).deleted).toBe(true)
  } finally {
    await deleteProject(request, id)
  }
})
