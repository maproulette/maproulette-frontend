import type { Challenge } from '@/types/Challenge'
import { BACKEND_URL, challengeTasks, uniqueName } from './fixtures'
import { readChallenge } from './helpers/challenge'
import {
  chooseUpload,
  expect,
  featureCollection,
  fillBasics,
  lineByLine,
  OVERPASS_STUB_PORT,
  openCreateForm,
  startOverpassStub,
  submitAndReadId,
  test,
  waitForTaskNames,
} from './helpers/challengeSources'

const SPRINGS = [
  { id: 'node/101', name: 'North spring', coordinates: [-95.4541, 37.6861] as [number, number] },
  { id: 'node/102', name: 'East spring', coordinates: [-95.4532, 37.6872] as [number, number] },
  { id: 'node/103', name: 'South spring', coordinates: [-95.4553, 37.6853] as [number, number] },
]

test.describe.configure({ timeout: 90_000 })

test('an uploaded feature collection gets one task per feature with its properties and location', async ({
  page,
  request,
  project,
}) => {
  await openCreateForm(page, project.id)
  await fillBasics(page, uniqueName('e2e-upload-many'))
  await page.getByLabel('OSM/External Id Property').fill('@id')
  await page.getByRole('textbox', { name: 'Overpass QL' }).fill('[out:json];node;out;')
  await chooseUpload(page, 'springs.geojson', featureCollection(SPRINGS))
  await expect(page.getByText(/Selected: springs\.geojson/)).toBeVisible()

  const id = await submitAndReadId(page)

  const tasks = await waitForTaskNames(
    request,
    id,
    SPRINGS.map((spring) => spring.name)
  )
  for (const spring of SPRINGS) {
    const task = tasks.find((t) => t.geometries.features[0].properties?.name === spring.name)
    expect(task?.name).toBe(spring.id)
    expect(task?.status).toBe(0)
    expect(task?.geometries.features[0].geometry).toEqual({
      type: 'Point',
      coordinates: spring.coordinates,
    })
    expect(task?.geometries.features[0].properties?.['@id']).toBe(spring.id)
  }

  const stored = await readChallenge(request, id)
  expect(stored).toMatchObject({
    instruction: 'Check that {{name}} is still flowing.',
    checkinComment: 'Checked {{name}} #maproulette',
    osmIdProperty: '@id',
  })
  expect(stored.overpassQL ?? '').toBe('')
  expect(stored.remoteGeoJson ?? '').toBe('')
})

test('a remote GeoJSON URL is downloaded by the backend and turned into tasks', async ({
  page,
  request,
  project,
  geojsonServer,
}) => {
  geojsonServer.serve('/springs.geojson', featureCollection(SPRINGS))
  await openCreateForm(page, project.id)
  await fillBasics(page, uniqueName('e2e-remote-many'))
  await page.getByRole('textbox', { name: 'Overpass QL' }).fill('[out:json];node;out;')
  await page.getByRole('radio', { name: /I have a URL to the GeoJSON data/ }).check()
  await page.getByLabel('GeoJSON URL').fill(geojsonServer.backendUrl('/springs.geojson'))

  const id = await submitAndReadId(page)

  await waitForTaskNames(
    request,
    id,
    SPRINGS.map((spring) => spring.name)
  )
  expect(geojsonServer.requests('/springs.geojson')).toBeGreaterThan(0)
  const stored = await readChallenge(request, id)
  expect(stored.remoteGeoJson).toBe(geojsonServer.backendUrl('/springs.geojson'))
  expect(stored.overpassQL ?? '').toBe('')
})

test('a line-by-line GeoJSON upload gets one task per line', async ({ page, request, project }) => {
  await openCreateForm(page, project.id)
  await fillBasics(page, uniqueName('e2e-line-by-line'))
  await chooseUpload(page, 'springs.geojsonl', lineByLine(SPRINGS))

  const id = await submitAndReadId(page)

  const tasks = await waitForTaskNames(
    request,
    id,
    SPRINGS.map((spring) => spring.name)
  )
  expect(tasks.every((task) => task.geometries.features.length === 1)).toBe(true)
})

test('features sharing a bundle id become one task holding all of them', async ({
  page,
  request,
  project,
}) => {
  await openCreateForm(page, project.id)
  await fillBasics(page, uniqueName('e2e-bundled'))
  await chooseUpload(
    page,
    'springs.geojson',
    featureCollection([
      { ...SPRINGS[0], extra: { group: 'valley' } },
      { ...SPRINGS[1], extra: { group: 'valley' } },
      { ...SPRINGS[2], extra: { group: 'ridge' } },
    ])
  )
  await page.getByLabel('Task Bundle Id Property').fill('group')

  const id = await submitAndReadId(page)

  let tasks: Awaited<ReturnType<typeof challengeTasks>> = []
  await expect
    .poll(
      async () => {
        tasks = await challengeTasks(request, id)
        return tasks.map((task) => task.geometries.features.length).sort()
      },
      { timeout: 60_000 }
    )
    .toEqual([1, 2])
  const valley = tasks.find((task) => task.geometries.features.length === 2)
  expect(valley?.geometries.features.map((feature) => feature.properties?.name).sort()).toEqual([
    'East spring',
    'North spring',
  ])
  expect((await readChallenge(request, id)).taskBundleIdProperty).toBe('group')
})

test('a file that is not valid GeoJSON is refused with its parse error and creates nothing', async ({
  page,
  request,
  project,
}) => {
  const name = uniqueName('e2e-invalid')
  await openCreateForm(page, project.id)
  await fillBasics(page, name)
  await chooseUpload(page, 'broken.geojson', '{"type": "FeatureCollection", "features": [')

  await page.getByRole('button', { name: 'Create Challenge' }).click()

  await expect(page.getByRole('alert')).toContainText('Challenge could not be created', {
    timeout: 15_000,
  })
  await expect(page.getByRole('alert')).toContainText(/JSON/)
  await expect(page).toHaveURL(/\/manage\/challenge\/new/)
  const response = await request.get(
    `${BACKEND_URL}/api/v2/project/${project.id}/challenges?limit=100`
  )
  const names = ((await response.json()) as Challenge[]).map((challenge) => challenge.name)
  expect(names).not.toContain(name)
})

test('an Overpass query is run by the backend and its results become tasks', async ({
  page,
  request,
  project,
}) => {
  const stub = await startOverpassStub(OVERPASS_STUB_PORT)
  try {
    await openCreateForm(page, project.id)
    await fillBasics(page, uniqueName('e2e-overpass'))
    await page.getByRole('radio', { name: /provide an Overpass query/i }).check()
    await page
      .getByRole('textbox', { name: 'Overpass QL' })
      .fill('[out:json];node["natural"="spring"](37.68,-95.46,37.69,-95.45);out;')

    const id = await submitAndReadId(page)

    await waitForTaskNames(
      request,
      id,
      SPRINGS.map((spring) => spring.name)
    )
    expect(stub.queries.some((query) => query.includes('natural'))).toBe(true)
  } finally {
    await stub.close()
  }
})
