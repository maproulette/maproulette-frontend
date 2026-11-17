import type { Page } from '@playwright/test'
import { BACKEND_URL, type TestTask } from './fixtures'
import { test as base, createEditorChallenge, createEditorTask, expect } from './helpers/editor'
import { startMapping } from './helpers/task'

const CHANGE_XML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<osmChange version="0.6" generator="MapRoulette e2e">' +
  '<create><node id="-1" lat="37.6866588" lon="-95.454772" version="0">' +
  '<tag k="amenity" v="bench"/></node></create>' +
  '</osmChange>'

const changeFileWork = {
  meta: { version: 2, type: 2 },
  file: {
    type: 'xml',
    format: 'osc',
    encoding: 'base64',
    content: Buffer.from(CHANGE_XML).toString('base64'),
  },
}

const test = base.extend<{ changeFileTask: TestTask }>({
  changeFileTask: async ({ request, project }, use) => {
    const challenge = await createEditorChallenge(request, project.id)
    await use(await createEditorTask(request, challenge.id, { cooperativeWork: changeFileWork }))
  },
})

const menuItem = (page: Page, label: string) =>
  page.getByRole('menuitem').filter({ hasText: label }).first()

const openEditorMenu = (page: Page) =>
  page.getByRole('button', { name: 'Open in another editor, or change the default' }).click()

for (const { label, newLayer, dataLayer } of [
  { label: 'Edit in new JOSM layer', newLayer: 'true', dataLayer: 'OSM Data' },
  { label: 'Edit in JOSM', newLayer: 'false', dataLayer: 'Changes' },
]) {
  test(`${label} loads the task area and imports the change file the backend serves`, async ({
    mapper,
    josmCommands: commands,
    request,
    changeFileTask,
  }) => {
    const { page } = mapper
    const id = changeFileTask.id
    await startMapping(page, id)

    await expect(async () => {
      commands.length = 0
      await openEditorMenu(page)
      await menuItem(page, label).click()
      await expect
        .poll(() => commands.map((command) => command.pathname), { timeout: 5_000 })
        .toEqual(expect.arrayContaining(['/load_and_zoom', '/import']))
    }).toPass({ timeout: 40_000 })

    const paths = commands.map((command) => command.pathname)
    expect(paths.indexOf('/load_and_zoom')).toBeLessThan(paths.indexOf('/import'))

    const load = commands.find((command) => command.pathname === '/load_and_zoom')
    expect(load?.searchParams.get('new_layer')).toBe(newLayer)
    expect(load?.searchParams.get('layer_name')).toBe(`MR Task ${id} ${dataLayer}`)

    const changeImport = commands.find((command) => command.pathname === '/import')
    expect(changeImport?.searchParams.get('new_layer')).toBe(newLayer)
    expect(changeImport?.searchParams.get('layer_name')).toBe(`MR Task ${id} Changes`)
    const changeUrl = new URL(changeImport?.searchParams.get('url') ?? '')
    expect(changeUrl.pathname).toBe(`/api/v2/task/${id}/cooperative/change/task_${id}_change.osc`)

    const served = await request.get(`${BACKEND_URL}${changeUrl.pathname}`)
    expect(served.ok()).toBe(true)
    expect(await served.text()).toBe(CHANGE_XML)
  })
}

test('only JOSM can be chosen, and the main button falls back to it', async ({
  mapper,
  josmCommands: commands,
  changeFileTask,
}) => {
  const { page } = mapper
  await startMapping(page, changeFileTask.id)

  await expect(page.getByRole('button', { name: 'Edit in iD', exact: true })).toBeDisabled({
    timeout: 20_000,
  })

  await openEditorMenu(page)
  for (const label of [
    'Edit in iD',
    'Edit just features in JOSM',
    'Edit in level0',
    'Edit in Rapid',
  ]) {
    await expect(menuItem(page, label)).toHaveAttribute('aria-disabled', 'true')
  }
  for (const label of ['Edit in JOSM', 'Edit in new JOSM layer']) {
    await expect(menuItem(page, label)).not.toHaveAttribute('aria-disabled', 'true')
  }
  await page.keyboard.press('Escape')

  const primary = page.getByRole('button', { name: 'Edit in new JOSM layer', exact: true })
  await primary.click()
  await expect
    .poll(() => commands.map((command) => command.pathname), { timeout: 10_000 })
    .toEqual(expect.arrayContaining(['/load_and_zoom', '/import']))
})
