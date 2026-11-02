import { expect, test } from './fixtures'
import { deleteProjectNow, findProjectByName, getProject } from './helpers/project'

test('creating a project with every field filled in stores each value', async ({
  page,
  request,
}) => {
  const name = `e2e-form-project-${Date.now()}`
  const displayName = `E2E Form Project ${Date.now()}`
  const description = 'Every field on the project form, filled in by the E2E suite.'

  await page.goto('/manage/project/new')
  await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible({
    timeout: 15_000,
  })

  await page.getByLabel('Project Name').fill(name)
  await page.getByLabel('Display Name').fill(displayName)
  await page.getByLabel('Description').fill(description)

  const enabled = page.getByRole('switch', { name: 'Enabled' })
  const featured = page.getByRole('switch', { name: 'Featured' })
  await expect(enabled).toBeChecked()
  await expect(featured).not.toBeChecked()
  await enabled.click()
  await featured.click()
  await expect(enabled).not.toBeChecked()
  await expect(featured).toBeChecked()
  await expect(page.getByRole('button', { name: 'No team' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )

  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByText('Project created successfully')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(/\/manage\/project\/\d+$/, { timeout: 30_000 })

  const projectId = Number(new URL(page.url()).pathname.split('/').pop())
  try {
    const stored = await getProject(request, projectId)
    expect(stored).toMatchObject({
      name,
      displayName,
      description,
      enabled: false,
      featured: true,
      isArchived: false,
    })
    expect(stored.ownerTeamId ?? null).toBeNull()

    await expect(page.getByRole('heading', { name: displayName }).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(description)).toBeVisible()
    await expect(page.getByText(`ID ${projectId}`)).toBeVisible()
    await expect(page.getByText('Featured', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enable project' })).toBeVisible()
  } finally {
    await deleteProjectNow(request, projectId)
  }
})

test('the project form refuses to submit without a name or display name', async ({
  page,
  request,
}) => {
  const description = `Never saved ${Date.now()}`

  await page.goto('/manage/project/new')
  await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible({
    timeout: 15_000,
  })

  await page.getByLabel('Description').fill(description)
  await page.getByRole('button', { name: 'Create Project' }).click()

  await expect(page.getByText('Project name is required')).toBeVisible()
  await expect(page.getByText('Display name is required')).toBeVisible()
  await expect(page).toHaveURL(/\/manage\/project\/new$/)

  await page.getByLabel('Project Name').fill('only-a-name')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await expect(page.getByText('Project name is required')).toBeHidden()
  await expect(page.getByText('Display name is required')).toBeVisible()
  await expect(page).toHaveURL(/\/manage\/project\/new$/)

  expect(await findProjectByName(request, 'only-a-name')).toBeUndefined()
})

test('the project form refuses names longer than 255 characters', async ({ page, request }) => {
  const tooLong = `e2e-${'x'.repeat(260)}`

  await page.goto('/manage/project/new')
  await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible({
    timeout: 15_000,
  })

  await page.getByLabel('Project Name').fill(tooLong)
  await page.getByLabel('Display Name').fill(tooLong)
  await page.getByRole('button', { name: 'Create Project' }).click()

  await expect(page.getByText(/255/).first()).toBeVisible()
  await expect(page.getByText(/255/)).toHaveCount(2)
  await expect(page).toHaveURL(/\/manage\/project\/new$/)
  expect(await findProjectByName(request, tooLong)).toBeUndefined()
})

test('the edit form loads the stored values and only allows saving once something changes', async ({
  page,
  project,
}) => {
  await page.goto(`/manage/project/${project.id}/edit`)

  await expect(page.getByLabel('Project Name')).toHaveValue(project.name, { timeout: 15_000 })
  await expect(page.getByLabel('Display Name')).toHaveValue(project.name)
  await expect(page.getByLabel('Description')).toHaveValue('E2E test project')
  await expect(page.getByRole('switch', { name: 'Enabled' })).toBeChecked()
  await expect(page.getByRole('switch', { name: 'Featured' })).not.toBeChecked()

  const update = page.getByRole('button', { name: 'Update Project' })
  await expect(update).toBeDisabled()

  await page.getByLabel('Description').fill('Changed')
  await expect(update).toBeEnabled()

  await page.getByLabel('Description').fill('E2E test project')
  await expect(update).toBeDisabled()
})

test('editing every field of a project is saved and shown again on reload', async ({
  page,
  project,
  request,
}) => {
  const name = `${project.name}-renamed`
  const displayName = `Renamed ${project.name}`
  const description = 'A description written by the edit-project E2E test.'

  await page.goto(`/manage/project/${project.id}/edit`)
  await expect(page.getByLabel('Project Name')).toHaveValue(project.name, { timeout: 15_000 })

  await page.getByLabel('Project Name').fill(name)
  await page.getByLabel('Display Name').fill(displayName)
  await page.getByLabel('Description').fill(description)
  await page.getByRole('switch', { name: 'Enabled' }).click()
  await page.getByRole('switch', { name: 'Featured' }).click()

  await page.getByRole('button', { name: 'Update Project' }).click()
  await expect(page.getByText('Project updated successfully')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(new RegExp(`/manage/project/${project.id}$`), { timeout: 30_000 })

  expect(await getProject(request, project.id)).toMatchObject({
    name,
    displayName,
    description,
    enabled: false,
    featured: true,
  })

  await expect(page.getByRole('heading', { name: displayName }).first()).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText(description)).toBeVisible()

  await page.goto(`/manage/project/${project.id}/edit`)
  await expect(page.getByLabel('Project Name')).toHaveValue(name, { timeout: 15_000 })
  await expect(page.getByLabel('Display Name')).toHaveValue(displayName)
  await expect(page.getByLabel('Description')).toHaveValue(description)
  await expect(page.getByRole('switch', { name: 'Enabled' })).not.toBeChecked()
  await expect(page.getByRole('switch', { name: 'Featured' })).toBeChecked()

  await page.getByRole('switch', { name: 'Enabled' }).click()
  await page.getByRole('switch', { name: 'Featured' }).click()
  await page.getByRole('button', { name: 'Update Project' }).click()
  await expect(page).toHaveURL(new RegExp(`/manage/project/${project.id}$`), { timeout: 30_000 })

  expect(await getProject(request, project.id)).toMatchObject({
    name,
    enabled: true,
    featured: false,
  })
})

test('clearing a project description is saved', async ({ page, project, request }) => {
  await page.goto(`/manage/project/${project.id}/edit`)
  await expect(page.getByLabel('Description')).toHaveValue('E2E test project', { timeout: 15_000 })

  await page.getByLabel('Description').fill('')
  await page.getByRole('button', { name: 'Update Project' }).click()
  await expect(page).toHaveURL(new RegExp(`/manage/project/${project.id}$`), { timeout: 30_000 })

  expect((await getProject(request, project.id)).description ?? '').toBe('')
  await page.goto(`/manage/project/${project.id}/edit`)
  await expect(page.getByLabel('Description')).toHaveValue('', { timeout: 15_000 })
})

test('cancelling an edit leaves the project as it was', async ({ page, project, request }) => {
  await page.goto(`/manage/project/${project.id}/edit`)
  await expect(page.getByLabel('Project Name')).toHaveValue(project.name, { timeout: 15_000 })

  await page.getByLabel('Display Name').fill('This should never be saved')
  await page.getByRole('switch', { name: 'Enabled' }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page).toHaveURL(new RegExp(`/manage/project/${project.id}$`), { timeout: 15_000 })
  expect(await getProject(request, project.id)).toMatchObject({
    name: project.name,
    displayName: project.name,
    enabled: true,
  })
  await expect(page.getByText('This should never be saved')).toBeHidden()
})
