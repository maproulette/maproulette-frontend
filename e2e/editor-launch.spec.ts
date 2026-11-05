import type { Page } from '@playwright/test'
import type { User } from '@/types/User'
import { BACKEND_URL } from './fixtures'
import {
  CHECKIN_SOURCE,
  createChallengeWith,
  createTaskWith,
  expect,
  expectedComment,
  expectNearTask,
  hashParams,
  OSM_NODE_ID,
  recordJosmCommands,
  runtimeEnv,
  stubExternalEditors,
  TASK_POINT,
  test,
} from './helpers/editor'
import { completeTask, getTask, startMapping, storedTaskRow, TASK_STATUS } from './helpers/task'

const menuItem = (page: Page, label: string) =>
  page.getByRole('menuitem').filter({ hasText: label })

const openEditorMenu = (page: Page) =>
  page.getByRole('button', { name: 'Open in another editor, or change the default' }).click()

async function launchInNewTab(page: Page, label: string) {
  const popup = page.waitForEvent('popup')
  await openEditorMenu(page)
  await menuItem(page, label).first().click()
  return (await popup).url()
}

const mapParam = (value: string | null) => {
  const [zoom, lat, lng] = (value ?? '').split('/').map(Number)
  expect(zoom).toBeGreaterThan(0)
  expectNearTask(lat, lng)
}

const expectBoundsAroundTask = (params: URLSearchParams) => {
  expect(Number(params.get('left'))).toBeLessThan(TASK_POINT[0])
  expect(Number(params.get('right'))).toBeGreaterThan(TASK_POINT[0])
  expect(Number(params.get('bottom'))).toBeLessThan(TASK_POINT[1])
  expect(Number(params.get('top'))).toBeGreaterThan(TASK_POINT[1])
}

test('iD opens on openstreetmap.org with the task element, map, comment, source and imagery', async ({
  mapper,
  editorTask,
}) => {
  const { page } = mapper
  await stubExternalEditors(page.context())
  const env = await runtimeEnv(page)
  await startMapping(page, editorTask.task.id)

  await expect(async () => {
    const url = new URL(await launchInNewTab(page, 'Edit in iD'))
    expect(`${url.origin}${url.pathname}`).toBe(env.idEditorUrl)
    expect(url.searchParams.get('editor')).toBe('id')
    expect(url.searchParams.get('node')).toBe(String(OSM_NODE_ID))
    const hash = hashParams(url.toString())
    expect(hash.get('comment')).toBe(
      expectedComment(env, editorTask.challenge.id, editorTask.task.id)
    )
    expect(hash.get('source')).toBe(CHECKIN_SOURCE)
    expect(hash.get('background')).toBe('Bing')
    mapParam(hash.get('map'))
  }).toPass({ timeout: 30_000 })
  await expect(page.getByText('Opening task in Edit in iD').first()).toBeVisible()
})

test('Rapid opens with the task element, an unescaped map position and the changeset comment', async ({
  mapper,
  editorTask,
}) => {
  const { page } = mapper
  await stubExternalEditors(page.context())
  const env = await runtimeEnv(page)
  await startMapping(page, editorTask.task.id)

  await expect(async () => {
    const url = await launchInNewTab(page, 'Edit in Rapid')
    expect(url.split('#')[0]).toBe(env.rapidEditorUrl)
    expect(url).toMatch(/[#&]map=[\d.]+\/-?[\d.]+\/-?[\d.]+(&|$)/)
    const hash = hashParams(url)
    expect(hash.get('id')).toBe(`n${OSM_NODE_ID}`)
    expect(hash.get('comment')).toBe(
      expectedComment(env, editorTask.challenge.id, editorTask.task.id)
    )
    expect(hash.get('source')).toBe(CHECKIN_SOURCE)
    expect(hash.get('background')).toBe('Bing')
    mapParam(hash.get('map'))
  }).toPass({ timeout: 30_000 })
})

test('Level0 opens centred on the task with its element and the changeset comment', async ({
  mapper,
  editorTask,
}) => {
  const { page } = mapper
  await stubExternalEditors(page.context())
  const env = await runtimeEnv(page)
  await startMapping(page, editorTask.task.id)

  const url = new URL(await launchInNewTab(page, 'Edit in level0'))
  expect(`${url.origin}${url.pathname}`).toBe(env.level0EditorUrl)
  const [lat, lng] = (url.searchParams.get('center') ?? '').split(',').map(Number)
  expectNearTask(lat, lng)
  expect(url.searchParams.get('comment')).toBe(
    expectedComment(env, editorTask.challenge.id, editorTask.task.id)
  )
  expect(url.searchParams.get('url')).toBe(`n${OSM_NODE_ID}`)
})

for (const { label, newLayer } of [
  { label: 'Edit in JOSM', newLayer: 'false' },
  { label: 'Edit in new JOSM layer', newLayer: 'true' },
]) {
  test(`${label} asks JOSM to load the task area with the changeset comment and imagery`, async ({
    mapper,
    editorTask,
  }) => {
    const { page } = mapper
    const commands = await recordJosmCommands(page.context())
    const env = await runtimeEnv(page)
    await startMapping(page, editorTask.task.id)

    await expect(async () => {
      commands.length = 0
      await openEditorMenu(page)
      await menuItem(page, label).first().click()
      await expect.poll(() => commands.length, { timeout: 5_000 }).toBe(2)
      const [load, imagery] = commands
      expect(load.pathname).toBe('/load_and_zoom')
      expectBoundsAroundTask(load.searchParams)
      expect(load.searchParams.get('new_layer')).toBe(newLayer)
      expect(load.searchParams.get('layer_name')).toBe(`MR Task ${editorTask.task.id}`)
      expect(load.searchParams.get('changeset_comment')).toBe(
        expectedComment(env, editorTask.challenge.id, editorTask.task.id)
      )
      expect(load.searchParams.get('changeset_source')).toBe(CHECKIN_SOURCE)
      expect(load.searchParams.get('select')).toBe(`node${OSM_NODE_ID}`)
      expect(imagery.pathname).toBe('/imagery')
      expect(Object.fromEntries(imagery.searchParams)).toMatchObject({
        id: 'Bing',
        title: 'Bing Aerial',
        type: 'bing',
      })
    }).toPass({ timeout: 40_000 })
    await expect(page.getByText(`Opening task in ${label}`).first()).toBeVisible()
  })
}

test('editing just the features in JOSM loads the task element and then zooms to it', async ({
  mapper,
  editorTask,
}) => {
  const { page } = mapper
  const commands = await recordJosmCommands(page.context())
  const env = await runtimeEnv(page)
  await startMapping(page, editorTask.task.id)

  await openEditorMenu(page)
  await menuItem(page, 'Edit just features in JOSM').first().click()
  await expect.poll(() => commands.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2)

  const [load, zoom] = commands
  expect(load.pathname).toBe('/load_object')
  expect(load.searchParams.get('objects')).toBe(`node${OSM_NODE_ID}`)
  expect(load.searchParams.get('new_layer')).toBe('true')
  expect(load.searchParams.get('changeset_comment')).toBe(
    expectedComment(env, editorTask.challenge.id, editorTask.task.id)
  )
  expect(load.searchParams.get('changeset_source')).toBe(CHECKIN_SOURCE)
  expectBoundsAroundTask(load.searchParams)
  expect(zoom.pathname).toBe('/zoom')
  expectBoundsAroundTask(zoom.searchParams)
})

test('the R key opens the task in JOSM', async ({ mapper, editorTask }) => {
  const { page } = mapper
  const commands = await recordJosmCommands(page.context())
  await startMapping(page, editorTask.task.id)

  await page.locator('body').press('r')
  await expect.poll(() => commands[0]?.pathname, { timeout: 10_000 }).toBe('/load_and_zoom')
  expect(commands[0].searchParams.get('new_layer')).toBe('false')
})

test('a mapper is told when JOSM is not running', async ({ mapper, editorTask }) => {
  const { page } = mapper
  await page.context().route('http://127.0.0.1:8111/**', (route) => route.abort())
  await startMapping(page, editorTask.task.id)

  await openEditorMenu(page)
  await menuItem(page, 'Edit in JOSM').first().click()
  await expect(
    page.getByText(
      'OSM remote control did not respond. Do you have JOSM running with Remote Control enabled?'
    )
  ).toBeVisible({ timeout: 15_000 })
})

test('the chosen default editor is saved and opened by the main editor button', async ({
  mapper,
  editorTask,
}) => {
  const { page } = mapper
  await stubExternalEditors(page.context())
  const env = await runtimeEnv(page)
  await startMapping(page, editorTask.task.id)

  await openEditorMenu(page)
  await menuItem(page, 'Edit in Rapid').nth(1).click()
  await expect(page.getByText('Default editor updated')).toBeVisible({ timeout: 15_000 })

  const user = await mapper.request.get(`${BACKEND_URL}/api/v2/user/${mapper.user.id}`)
  expect(((await user.json()) as User).settings.defaultEditor).toBe(5)

  await page.reload()
  const primary = page.getByRole('button', { name: 'Edit in Rapid', exact: true })
  await expect(primary).toBeVisible({ timeout: 20_000 })
  const popup = page.waitForEvent('popup')
  await primary.click()
  expect((await popup).url().split('#')[0]).toBe(env.rapidEditorUrl)
})

test('a task without an OSM element opens iD on its location and cannot load features in JOSM', async ({
  mapper,
  request,
  editorTask,
}) => {
  const { page } = mapper
  await stubExternalEditors(page.context())
  const commands = await recordJosmCommands(page.context())
  const bare = await createTaskWith(request, editorTask.challenge.id, {
    properties: { name: 'Spring & Well', ref: '42' },
  })
  await startMapping(page, bare.id)

  const url = new URL(await launchInNewTab(page, 'Edit in iD'))
  expect(url.searchParams.has('node')).toBe(false)
  mapParam(hashParams(url.toString()).get('map'))

  await openEditorMenu(page)
  await menuItem(page, 'Edit just features in JOSM').first().click()
  await expect(page.getByText('Task has no OSM feature IDs to load')).toBeVisible({
    timeout: 10_000,
  })
  expect(commands).toHaveLength(0)
})

test('a disabled challenge leaves the short link out of the changeset comment', async ({
  mapper,
  request,
  project,
}) => {
  const { page } = mapper
  await stubExternalEditors(page.context())
  const challenge = await createChallengeWith(request, project.id, { enabled: false })
  const task = await createTaskWith(request, challenge.id)
  await startMapping(page, task.id)

  const url = await launchInNewTab(page, 'Edit in iD')
  expect(hashParams(url).get('comment')).toBe(
    'Checked Spring & Well (ref 42) #maproulette #maproulette-beta'
  )
})

test('a task opened in an editor is locked to the mapper and can then be marked fixed', async ({
  mapper,
  request,
  editorTask,
}) => {
  const { page } = mapper
  await stubExternalEditors(page.context())
  await startMapping(page, editorTask.task.id)
  await launchInNewTab(page, 'Edit in iD')

  expect((await getTask(request, editorTask.task.id)).lockedBy).toBe(mapper.user.id)

  await completeTask(page, 'Fixed', { toast: 'Fixed' })
  await expect
    .poll(async () => (await getTask(request, editorTask.task.id)).status)
    .toBe(TASK_STATUS.fixed)
  expect(storedTaskRow(editorTask.task.id).completedBy).toBe(mapper.user.id)
})
