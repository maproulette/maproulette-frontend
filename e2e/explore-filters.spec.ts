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

test('the default sort lists saved challenges first, then featured ones, then the rest', async ({
  mapper,
  request,
  project,
}) => {
  // Narrowed with the Transit filter rather than a unique tag (the explore page
  // has no tag filter), so keep 'railway' out of other specs' challenges.
  const tag = keyword('e2esort')
  const tags = ['railway', tag]
  const featured = await createWithTask(request, project.id, tags, { name: `${tag}-b` })
  const saved = await createWithTask(request, project.id, tags, { name: `${tag}-c` })
  const plain = await createWithTask(request, project.id, tags, { name: `${tag}-a` })
  listInExplore([featured.id, saved.id, plain.id], [featured.id])
  const save = await mapper.request.post(
    `${BACKEND_URL}/api/v2/user/${mapper.user.id}/save/${saved.id}`
  )
  expect(save.ok()).toBe(true)

  const { page } = mapper
  await page.goto('/?viewMode=list&workOn=Transit')
  await expect(page.getByRole('combobox').filter({ hasText: 'Recommended' })).toBeVisible({
    timeout: 15_000,
  })
  const names = [plain.name, featured.name, saved.name]
  await expect
    .poll(() => listedOrder(page, names), { timeout: 15_000 })
    .toEqual([saved.name, featured.name, plain.name])

  await page.getByRole('combobox').filter({ hasText: 'Recommended' }).click()
  await page.getByRole('option', { name: 'Name', exact: true }).click()
  await expect
    .poll(() => listedOrder(page, names), { timeout: 15_000 })
    .toEqual([plain.name, featured.name, saved.name])
})
