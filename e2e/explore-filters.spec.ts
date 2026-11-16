import type { APIRequestContext, Page } from '@playwright/test'
import { BACKEND_URL, createChallenge, createTask, runSql, uniqueName } from './fixtures'
import { expect, test } from './helpers/task'

const keyword = (prefix: string) => uniqueName(prefix).replace(/-/g, '').toLowerCase()

async function createWithTask(
  request: APIRequestContext,
  projectId: number,
  tags: string[],
  fields: Record<string, unknown> = {}
) {
  const challenge = await createChallenge(request, projectId, { tags, ...fields })
  await createTask(request, challenge.id)
  return challenge
}

function listInExplore(challengeIds: number[], featuredIds: number[] = []) {
  runSql(
    `UPDATE challenges c SET bounding = (SELECT ST_Expand(ST_Envelope(ST_Collect(location)), 0.001) FROM tasks WHERE parent_id = c.id), featured = c.id = ANY(ARRAY[${featuredIds.join(',')}]::bigint[]) WHERE c.id IN (${challengeIds.join(',')})`
  )
}

async function listedOrder(page: Page, names: string[]): Promise<string[]> {
  const rows = await page.getByRole('row').allTextContents()
  return rows.flatMap((row) => names.filter((name) => row.includes(name)))
}

test('the Categorize filter saves keywords on the account and lists only challenges with every selected one', async ({
  mapper,
  request,
  project,
}) => {
  const shared = keyword('e2eshared')
  const extra = keyword('e2eextra')
  const [both, one] = await Promise.all([
    createWithTask(request, project.id, [shared, extra]),
    createWithTask(request, project.id, [shared]),
  ])
  listInExplore([both.id, one.id])

  const { page } = mapper
  await page.goto('/?viewMode=list')
  await page.getByRole('button', { name: 'Categorize' }).click()
  const menu = page.getByRole('dialog', { name: 'Categorize' })
  await expect(menu.getByText('You have not set any categories.')).toBeVisible({ timeout: 15_000 })

  const add = menu.getByLabel('Add:')
  await add.fill(shared)
  await add.press('Enter')
  await expect(menu.getByRole('button', { name: shared, exact: true })).toBeVisible()
  await add.fill(extra)
  await add.press('Enter')
  await expect(menu.getByRole('button', { name: extra, exact: true })).toBeVisible()

  await expect
    .poll(async () => {
      const user = await mapper.request.get(`${BACKEND_URL}/api/v2/user/${mapper.user.id}`)
      return JSON.stringify(((await user.json()) as { properties?: unknown }).properties ?? {})
    })
    .toContain(extra)

  await menu.getByRole('button', { name: shared, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Categorize' })).toHaveText(/1 Filter/)
  await expect(page.getByText(both.name)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(one.name)).toBeVisible()

  await menu.getByRole('button', { name: extra, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Categorize' })).toHaveText(/2 Filters/)
  await expect(page.getByText(both.name)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(one.name)).not.toBeVisible()

  await menu.getByRole('button', { name: `Remove ${extra}` }).click()
  await expect(menu.getByRole('button', { name: extra, exact: true })).not.toBeVisible()
  await expect(page.getByText(one.name)).toBeVisible({ timeout: 15_000 })
})

test('the default sort lists saved challenges first, then featured ones, then the rest', async ({
  mapper,
  request,
  project,
}) => {
  const tag = keyword('e2esort')
  const featured = await createWithTask(request, project.id, [tag], { name: `${tag}-b` })
  const saved = await createWithTask(request, project.id, [tag], { name: `${tag}-c` })
  const plain = await createWithTask(request, project.id, [tag], { name: `${tag}-a` })
  listInExplore([featured.id, saved.id, plain.id], [featured.id])
  const save = await mapper.request.post(
    `${BACKEND_URL}/api/v2/user/${mapper.user.id}/save/${saved.id}`
  )
  expect(save.ok()).toBe(true)

  const { page } = mapper
  await page.goto(`/?viewMode=list&categories=${tag}`)
  await expect(page.getByRole('combobox').filter({ hasText: 'Default' })).toBeVisible({
    timeout: 15_000,
  })
  const names = [plain.name, featured.name, saved.name]
  await expect
    .poll(() => listedOrder(page, names), { timeout: 15_000 })
    .toEqual([saved.name, featured.name, plain.name])

  await page.getByRole('combobox').filter({ hasText: 'Default' }).click()
  await page.getByRole('option', { name: 'Name', exact: true }).click()
  await expect
    .poll(() => listedOrder(page, names), { timeout: 15_000 })
    .toEqual([plain.name, featured.name, saved.name])
})
