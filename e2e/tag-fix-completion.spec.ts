import type { APIRequestContext, BrowserContext, Page } from '@playwright/test'
import {
  createChallenge,
  createTask,
  TAG_FIX_POINT as ELEMENT_POINT,
  TAG_FIX_ELEMENT_ID,
  uniqueName,
} from './fixtures'
import { expect, runtimeEnv, test } from './helpers/editor'
import { completeTask, getTask, startMapping, TASK_STATUS } from './helpers/task'

const elementXml = (tags: Record<string, string>) =>
  `<?xml version="1.0" encoding="UTF-8"?><osm version="0.6"><node id="2344998584" lat="${ELEMENT_POINT[1]}" lon="${ELEMENT_POINT[0]}" version="3">${Object.entries(
    tags
  )
    .map(([k, v]) => `<tag k="${k}" v="${v}"/>`)
    .join('')}</node></osm>`

async function stubOsmElement(context: BrowserContext, tags: Record<string, string>) {
  await context.route('https://api.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/xml', body: elementXml(tags) })
  )
}

async function createCooperativeTask(
  request: APIRequestContext,
  challengeId: number,
  cooperativeWork: Record<string, unknown>
) {
  const task = await createTask(request, challengeId, {
    name: uniqueName('e2e-cooperative'),
    coordinates: ELEMENT_POINT,
    properties: { '@id': TAG_FIX_ELEMENT_ID, amenity: 'cafe' },
    instruction: 'Review the proposed change.',
    priority: 0,
    cooperativeWork,
  })
  return task.id
}

const tagFixWork = {
  meta: { version: 2, type: 1 },
  operations: [
    {
      operationType: 'modifyElement',
      data: {
        id: TAG_FIX_ELEMENT_ID,
        operations: [
          { operation: 'setTags', data: { 'diet:vegetarian': 'yes', cuisine: 'bakery' } },
          { operation: 'unsetTags', data: ['fixme'] },
        ],
      },
    },
  ],
}

const changeFileWork = {
  meta: { version: 2, type: 2 },
  file: {
    type: 'xml',
    format: 'osc',
    encoding: 'base64',
    content: Buffer.from(
      `<osmChange version="0.6"><modify><node id="2344998584" lat="${ELEMENT_POINT[1]}" lon="${ELEMENT_POINT[0]}" version="3"><tag k="amenity" v="cafe"/><tag k="diet:vegetarian" v="yes"/></node></modify></osmChange>`
    ).toString('base64'),
  },
}

const suggestion = (page: Page) =>
  page.locator('section').filter({ hasText: 'Suggested tag changes' })

const change = (page: Page, key: string) =>
  suggestion(page)
    .getByRole('listitem')
    .filter({ has: page.getByText(key, { exact: true }) })

test("a tag fix is shown against the element's current tags in OpenStreetMap", async ({
  page,
  request,
  project,
}) => {
  const challenge = await createChallenge(request, project.id)
  const taskId = await createCooperativeTask(request, challenge.id, tagFixWork)
  await stubOsmElement(page.context(), {
    amenity: 'cafe',
    cuisine: 'coffee',
    fixme: 'check opening hours',
    'diet:vegetarian': 'no',
  })

  await page.goto(`/tasks/${taskId}`)
  await expect(suggestion(page)).toContainText(TAG_FIX_ELEMENT_ID, { timeout: 30_000 })
  await expect(change(page, 'diet:vegetarian')).toHaveText(/^change\s*diet:vegetarian\s*no\s*yes$/i)
  await expect(change(page, 'cuisine')).toHaveText(/^change\s*cuisine\s*coffee\s*bakery$/i)
  await expect(change(page, 'fixme')).toHaveText(/^remove\s*fixme\s*check opening hours$/i)
  await expect(change(page, 'amenity')).toHaveCount(0)
})

test('a tag fix whose element already carries the tags says there is nothing to change', async ({
  page,
  tagFixTask,
}) => {
  await stubOsmElement(page.context(), { amenity: 'cafe', 'diet:vegetarian': 'yes' })

  await page.goto(`/tasks/${tagFixTask.id}`)
  await expect(
    suggestion(page).getByText('This element already carries the suggested tags.')
  ).toBeVisible({ timeout: 30_000 })
  await expect(suggestion(page).getByRole('listitem')).toHaveCount(0)
})

test('working a tag-fix task opens the embedded iD on the element with the changeset comment', async ({
  mapper,
  tagFixTask,
  cooperativeChallenge,
}) => {
  const { page } = mapper
  await stubOsmElement(page.context(), { amenity: 'cafe' })
  const env = await runtimeEnv(page)

  await startMapping(page, tagFixTask.id)
  const frame = page.locator('iframe[src^="/id-editor.html"]')
  await expect(frame).toBeAttached({ timeout: 20_000 })

  const src = new URL((await frame.getAttribute('src')) ?? '', 'http://localhost')
  const hash = new URLSearchParams(src.hash.slice(1))
  const link = env.shortUrl
    ? ` ${env.shortUrl}/c/${cooperativeChallenge.id}/t/${tagFixTask.id}`
    : ''
  expect(hash.get('comment')).toBe(`E2E test changeset #maproulette${link} #maproulette-beta`)
  expect(hash.get('maproulette_task')).toBe(String(tagFixTask.id))
  expect(hash.get('id')).toBe('n2344998584')
  const [, lat, lng] = (hash.get('map') ?? '').split('/').map(Number)
  expect(Math.abs(lat - ELEMENT_POINT[1])).toBeLessThan(0.01)
  expect(Math.abs(lng - ELEMENT_POINT[0])).toBeLessThan(0.01)

  await page.getByRole('button', { name: 'Close editor' }).click()
  await expect(frame).toBeHidden()
  await page.getByRole('button', { name: 'Edit in iD', exact: true }).first().click()
  await expect(frame).toBeVisible()
})

test("a tag-fix task opens in the embedded iD even when the mapper's default editor is JOSM", async ({
  mapper,
  josmCommands: commands,
  tagFixTask,
}) => {
  const { page } = mapper
  await stubOsmElement(page.context(), { amenity: 'cafe' })

  await startMapping(page, tagFixTask.id)
  await page.getByRole('button', { name: 'Close editor' }).click()
  await page.getByRole('button', { name: 'Open in another editor, or change the default' }).click()
  await page.getByRole('menuitem').filter({ hasText: 'Edit in JOSM' }).nth(1).click()
  await expect(page.getByText('Default editor updated')).toBeVisible({ timeout: 15_000 })

  const primary = page.getByRole('button', { name: 'Edit in iD', exact: true }).first()
  await expect(primary).toBeVisible()
  await primary.click()
  await expect(page.locator('iframe[src^="/id-editor.html"]')).toBeVisible()
  expect(commands).toHaveLength(0)
})

test('a tag-fix task can be marked Fixed', async ({ mapper, request, tagFixTask }) => {
  const { page } = mapper
  await stubOsmElement(page.context(), { amenity: 'cafe' })

  await startMapping(page, tagFixTask.id)
  await expect(page.locator('iframe[src^="/id-editor.html"]')).toBeAttached({ timeout: 20_000 })
  await completeTask(page, 'Fixed', { toast: 'Fixed' })

  await expect
    .poll(async () => (await getTask(request, tagFixTask.id)).status)
    .toBe(TASK_STATUS.fixed)
})

test('a tag-fix challenge is labelled as one on its challenge page', async ({
  page,
  cooperativeChallenge,
}) => {
  await page.goto(`/challenge/${cooperativeChallenge.id}`)

  await expect(page.getByRole('heading', { name: cooperativeChallenge.name })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Tag Fix', { exact: true })).toBeVisible({ timeout: 15_000 })
})

test('an ordinary challenge is not labelled as a tag fix', async ({ page, challenge }) => {
  await page.goto(`/challenge/${challenge.id}`)

  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Tag Fix', { exact: true })).toBeHidden()
})

test('an ordinary task shows no suggested changes', async ({ page, task }) => {
  await page.goto(`/tasks/${task.id}`)

  await expect(page.getByRole('button', { name: 'Map this task' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Suggested tag changes')).toBeHidden()
})

test('a change-file cooperative challenge is labelled as cooperative, not as a tag fix', async ({
  page,
  request,
  project,
}) => {
  const challenge = await createChallenge(request, project.id)
  await createCooperativeTask(request, challenge.id, changeFileWork)

  await page.goto(`/challenge/${challenge.id}`)
  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Cooperative', { exact: true })).toBeVisible()
  await expect(page.getByText('Tag Fix', { exact: true })).toBeHidden()
})

test('a change-file cooperative task has its change loaded into JOSM alongside the task area', async ({
  mapper,
  josmCommands: commands,
  request,
  project,
}) => {
  test.fixme(
    true,
    'useEditorLaunch.ts sends only load_and_zoom for a change-file task; v3 also imported the task change file'
  )
  const { page } = mapper
  const challenge = await createChallenge(request, project.id)
  const taskId = await createCooperativeTask(request, challenge.id, changeFileWork)

  await startMapping(page, taskId)
  await page.getByRole('button', { name: 'Open in another editor, or change the default' }).click()
  await page.getByRole('menuitem').filter({ hasText: 'Edit in JOSM' }).first().click()
  await expect
    .poll(() => commands.some((command) => command.pathname === '/import'), { timeout: 10_000 })
    .toBe(true)

  const imported = commands.find((command) => command.pathname === '/import')
  expect(imported?.searchParams.get('url')).toMatch(
    new RegExp(`/api/v2/task/${taskId}/cooperative/change/task_${taskId}_change\\.osc$`)
  )
})
