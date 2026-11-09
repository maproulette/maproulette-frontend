import type { Page } from '@playwright/test'
import type { Task } from '@/types/Task'
import { challengeTasks, uniqueName } from './fixtures'
import {
  chooseUpload,
  expect,
  featureCollection,
  fillBasics,
  openCreateForm,
  setTaskStatus,
  submitAndReadId,
  test,
  waitForTaskNames,
} from './helpers/challengeSources'

test.describe.configure({ timeout: 120_000 })

const FIXED = 1

const ORIGINAL = [
  { id: 'node/201', name: 'Mill pond', coordinates: [-95.4541, 37.6861] as [number, number] },
  { id: 'node/202', name: 'Cedar pond', coordinates: [-95.4532, 37.6872] as [number, number] },
  { id: 'node/203', name: 'Hollow pond', coordinates: [-95.4553, 37.6853] as [number, number] },
]

const UPDATED = [
  { id: 'node/201', name: 'Mill pond', coordinates: [-95.4511, 37.6811] as [number, number] },
  { id: 'node/202', name: 'Cedar pond', coordinates: [-95.4532, 37.6872] as [number, number] },
  { id: 'node/204', name: 'Willow pond', coordinates: [-95.4564, 37.6864] as [number, number] },
]

const byName = (tasks: Task[], name: string) =>
  tasks.find((task) => task.geometries.features[0]?.properties?.name === name)

async function openRebuildDialog(page: Page, challengeId: number) {
  await page.goto(`/manage/challenge/${challengeId}`)
  await page.getByRole('button', { name: 'Rebuild tasks' }).click({ timeout: 20_000 })
  const dialog = page.getByRole('dialog', { name: 'Rebuild Challenge Tasks' })
  await expect(dialog).toBeVisible()
  return dialog
}

async function proceed(page: Page) {
  await page.getByRole('button', { name: 'Proceed' }).click()
  await expect(page.getByText('Tasks rebuilt')).toBeVisible({ timeout: 60_000 })
}

async function createUploadedChallenge(page: Page, projectId: number) {
  await openCreateForm(page, projectId)
  await fillBasics(page, uniqueName('e2e-rebuild-local'))
  await page.getByLabel('OSM/External Id Property').fill('@id')
  await chooseUpload(page, 'ponds.geojson', featureCollection(ORIGINAL))
  return submitAndReadId(page)
}

test('rebuilding from a new upload updates matched tasks, adds new ones and keeps the rest', async ({
  page,
  request,
  project,
}) => {
  const id = await createUploadedChallenge(page, project.id)
  const before = await waitForTaskNames(
    request,
    id,
    ORIGINAL.map((pond) => pond.name)
  )
  const cedar = byName(before, 'Cedar pond')
  if (!cedar) throw new Error('Cedar pond task was not built')
  await setTaskStatus(request, cedar.id, FIXED)

  const dialog = await openRebuildDialog(page, id)
  await expect(dialog).toContainText('upload a new local file')
  await expect(page.getByRole('button', { name: 'Proceed' })).toBeDisabled()
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'ponds.geojson',
    mimeType: 'application/geo+json',
    buffer: Buffer.from(featureCollection(UPDATED)),
  })
  await proceed(page)

  const after = await waitForTaskNames(request, id, [
    'Cedar pond',
    'Hollow pond',
    'Mill pond',
    'Willow pond',
  ])
  expect(byName(after, 'Mill pond')?.id).toBe(byName(before, 'Mill pond')?.id)
  expect(byName(after, 'Mill pond')?.geometries.features[0].geometry).toMatchObject({
    coordinates: UPDATED[0].coordinates,
  })
  expect(byName(after, 'Cedar pond')).toMatchObject({ id: cedar.id, status: FIXED })
  expect(byName(after, 'Hollow pond')?.id).toBe(byName(before, 'Hollow pond')?.id)
  expect(byName(after, 'Willow pond')?.status).toBe(0)

  await page.goto(`/manage/challenge/${id}`)
  const row = (task: Task | undefined) =>
    page.getByRole('row', { name: new RegExp(`Select task ${task?.id} `) })
  await expect(row(byName(after, 'Willow pond'))).toContainText('Created', { timeout: 20_000 })
  await expect(row(byName(after, 'Cedar pond'))).toContainText('Fixed')
  await expect(page.getByRole('row', { name: /Select task \d+/ })).toHaveCount(4)
})

test('rebuilding with incomplete tasks removed first drops the ones missing from the new data', async ({
  page,
  request,
  project,
}) => {
  const id = await createUploadedChallenge(page, project.id)
  const before = await waitForTaskNames(
    request,
    id,
    ORIGINAL.map((pond) => pond.name)
  )
  const cedar = byName(before, 'Cedar pond')
  if (!cedar) throw new Error('Cedar pond task was not built')
  await setTaskStatus(request, cedar.id, FIXED)

  const dialog = await openRebuildDialog(page, id)
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'ponds.geojson',
    mimeType: 'application/geo+json',
    buffer: Buffer.from(featureCollection(UPDATED)),
  })
  await dialog.getByRole('checkbox', { name: 'First remove incomplete tasks' }).check()
  await proceed(page)

  const after = await waitForTaskNames(request, id, ['Cedar pond', 'Mill pond', 'Willow pond'])
  expect(byName(after, 'Cedar pond')).toMatchObject({ id: cedar.id, status: FIXED })
  expect(byName(after, 'Hollow pond')).toBeUndefined()
})

test('rebuilding a remote challenge downloads the URL again and applies what it now serves', async ({
  page,
  request,
  project,
  geojsonServer,
}) => {
  geojsonServer.serve('/ponds.geojson', featureCollection(ORIGINAL))
  await openCreateForm(page, project.id)
  await fillBasics(page, uniqueName('e2e-rebuild-remote'))
  await page.getByLabel('OSM/External Id Property').fill('@id')
  await page.getByRole('radio', { name: /I have a URL to the GeoJSON data/ }).check()
  await page.getByLabel('GeoJSON URL').fill(geojsonServer.backendUrl('/ponds.geojson'))
  const id = await submitAndReadId(page)
  await waitForTaskNames(
    request,
    id,
    ORIGINAL.map((pond) => pond.name)
  )
  const downloads = geojsonServer.requests('/ponds.geojson')

  geojsonServer.serve('/ponds.geojson', featureCollection(UPDATED))
  const dialog = await openRebuildDialog(page, id)
  await expect(dialog).toContainText("re-download the GeoJSON data from the challenge's remote URL")
  await expect(dialog.locator('input[type="file"]')).toHaveCount(0)
  await dialog.getByRole('checkbox', { name: 'First remove incomplete tasks' }).check()
  await proceed(page)

  const after = await waitForTaskNames(request, id, ['Cedar pond', 'Mill pond', 'Willow pond'])
  expect(geojsonServer.requests('/ponds.geojson')).toBeGreaterThan(downloads)
  expect(byName(after, 'Mill pond')?.geometries.features[0].geometry).toMatchObject({
    coordinates: UPDATED[0].coordinates,
  })
  expect(await challengeTasks(request, id)).toHaveLength(3)
})
