import type { Page } from '@playwright/test'
import type { Task } from '@/types/Task'
import { BACKEND_URL } from './fixtures'
import {
  BASEMAP_CUSTOM,
  BASEMAP_IDENTIFIED,
  expect,
  listProjectChallenges,
  pickOption,
  readChallenge,
  readChallengeKeywords,
  test,
  uniqueName,
} from './helpers/challenge'

const OVERPASS_QUERY = '[out:json];node["natural"="spring"](37.68,-95.46,37.69,-95.45);out;'

const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-95.454772, 37.6866588] },
      properties: { name: 'E2E spring', '@id': 'node/1' },
    },
  ],
}

async function openCreateForm(page: Page, projectId: number) {
  await page.goto(`/manage/challenge/new?projectId=${projectId}`)
  await expect(page.getByRole('heading', { name: 'Create New Challenge' })).toBeVisible({
    timeout: 15_000,
  })
}

async function fillRequiredFields(page: Page, name: string) {
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Description').fill('Springs that need checking.')
  await page.getByLabel('Instructions').fill('Check the spring is still there.')
  await page.getByLabel('Changeset comment').fill('Checked springs')
  await page.getByLabel('Changeset source').fill('Bing')
  await page.getByRole('textbox', { name: 'Overpass QL' }).fill(OVERPASS_QUERY)
  await page.getByRole('checkbox', { name: /automated edits code of conduct/i }).check()
}

async function submitAndReadId(page: Page): Promise<number> {
  await page.getByRole('button', { name: 'Create Challenge' }).click()
  await expect(page).toHaveURL(/\/manage\/challenge\/\d+$/, { timeout: 30_000 })
  return Number(new URL(page.url()).pathname.split('/').pop())
}

test('creating a challenge stores every field the form offers', async ({
  page,
  request,
  project,
  team,
}) => {
  const name = uniqueName('e2e-created')
  await openCreateForm(page, project.id)

  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Description').fill('Springs that need checking.')
  await page.getByLabel('Instructions').fill('Check the spring at {{name}} is still there.')
  await pickOption(page, 'Difficulty', 'Expert')
  await pickOption(page, 'How should your Challenge be Categorized?', 'Water')
  await page.getByLabel('Additional Categorization Keywords').fill('springs,e2e')
  await page.getByLabel('Changeset comment').fill('Checked springs')
  await page.getByLabel('Changeset source').fill('Esri; survey')
  await page.getByRole('textbox', { name: 'Overpass QL' }).fill(OVERPASS_QUERY)
  await page.getByRole('button', { name: new RegExp(team.name) }).click()
  await pickOption(page, 'Challenge basemap', 'Bing Aerial')
  await page.getByLabel('OSM/External Id Property').fill('@id')
  await page.getByRole('checkbox', { name: /automated edits code of conduct/i }).check()

  const id = await submitAndReadId(page)

  const stored = await readChallenge(request, id)
  expect(stored).toMatchObject({
    name,
    parent: project.id,
    description: 'Springs that need checking.',
    instruction: 'Check the spring at {{name}} is still there.',
    difficulty: 3,
    checkinComment: 'Checked springs #maproulette',
    checkinSource: 'Esri; survey',
    overpassQL: OVERPASS_QUERY,
    osmIdProperty: '@id',
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Bing Aerial',
    ownerTeamId: team.id,
    enabled: true,
  })
  expect(await readChallengeKeywords(request, id)).toEqual(['e2e', 'natural', 'springs', 'water'])

  await expect(page.getByRole('heading', { name }).first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Expert').first()).toBeVisible()
})

test('a changeset comment that already has the #maproulette hashtag is not given a second one', async ({
  page,
  request,
  project,
}) => {
  await openCreateForm(page, project.id)
  await fillRequiredFields(page, uniqueName('e2e-hashtag'))
  await page.getByLabel('Changeset comment').fill('Checked springs #MapRoulette')

  const id = await submitAndReadId(page)

  expect((await readChallenge(request, id)).checkinComment).toBe('Checked springs #MapRoulette')
})

test('a custom basemap stores its tile template', async ({ page, request, project }) => {
  const template = 'https://tiles.example.com/imagery/{z}/{x}/{y}.png'
  await openCreateForm(page, project.id)
  await fillRequiredFields(page, uniqueName('e2e-custom-basemap'))

  await expect(page.getByLabel('Custom basemap URL')).toHaveCount(0)
  await pickOption(page, 'Challenge basemap', 'Custom tile layer…')
  await page.getByLabel('Custom basemap URL').fill(template)

  const id = await submitAndReadId(page)

  expect(await readChallenge(request, id)).toMatchObject({
    defaultBasemap: BASEMAP_CUSTOM,
    customBasemap: template,
  })
})

test('a challenge with no team, basemap or keywords stores them as unset', async ({
  page,
  request,
  project,
}) => {
  await openCreateForm(page, project.id)
  await fillRequiredFields(page, uniqueName('e2e-plain'))

  const id = await submitAndReadId(page)

  const stored = await readChallenge(request, id)
  expect(stored.ownerTeamId ?? null).toBeNull()
  expect(stored.defaultBasemap ?? -1).toBe(-1)
  expect(stored.difficulty).toBe(2)
  expect(await readChallengeKeywords(request, id)).toEqual([])
})

test('submitting an incomplete form names every missing field and creates nothing', async ({
  page,
  request,
  project,
}) => {
  await openCreateForm(page, project.id)
  await page.getByLabel('Name').fill('ab')
  await page.getByRole('button', { name: 'Create Challenge' }).click()

  const messages = [
    'Challenge name must be at least 3 characters',
    'Description is required',
    'Instructions are required',
    'A changeset comment is required',
    'A changeset source is required',
    'An Overpass query is required',
    'You must read and accept the Automated Edits code of conduct',
  ]
  for (const message of messages) {
    await expect(page.getByText(message).first()).toBeVisible()
  }

  await page.getByRole('button', { name: '7 fields need attention' }).click()
  const summary = page.getByRole('dialog', { name: 'Fields that need attention' })
  for (const message of messages) {
    await expect(summary.getByRole('button', { name: message })).toBeVisible()
  }
  await page.keyboard.press('Escape')

  await expect(page).toHaveURL(/\/manage\/challenge\/new/)
  expect(await listProjectChallenges(request, project.id)).toEqual([])
})

test('each task source asks for its own input', async ({ page, project }) => {
  await openCreateForm(page, project.id)
  await fillRequiredFields(page, uniqueName('e2e-sources'))

  await expect(page.getByLabel('Task Bundle Id Property')).toBeDisabled()

  await page.getByRole('radio', { name: /I have a URL to the GeoJSON data/ }).check()
  await expect(page.getByRole('textbox', { name: 'Overpass QL' })).toHaveCount(0)
  await expect(page.getByLabel('Task Bundle Id Property')).toBeEnabled()
  await page.getByRole('button', { name: 'Create Challenge' }).click()
  await expect(page.getByText('A GeoJSON URL is required').first()).toBeVisible()

  await page.getByRole('radio', { name: /upload a geojson file/i }).check()
  await page.getByRole('button', { name: 'Create Challenge' }).click()
  await expect(page.getByText('Please upload a GeoJSON file').first()).toBeVisible()
  await expect(page).toHaveURL(/\/manage\/challenge\/new/)
})

test('a challenge can be created from a GeoJSON URL', async ({ page, request, project }) => {
  const url = 'https://example.com/e2e/springs.geojson'
  await openCreateForm(page, project.id)
  await fillRequiredFields(page, uniqueName('e2e-remote'))
  await page.getByRole('radio', { name: /I have a URL to the GeoJSON data/ }).check()
  await page.getByLabel('GeoJSON URL').fill(url)

  const id = await submitAndReadId(page)

  const stored = await readChallenge(request, id)
  expect(stored.remoteGeoJson).toBe(url)
  expect(stored.overpassQL ?? '').toBe('')
})

test('a challenge created from an uploaded GeoJSON file gets a task for its feature', async ({
  page,
  request,
  project,
}) => {
  const name = uniqueName('e2e-upload')
  await openCreateForm(page, project.id)
  await fillRequiredFields(page, name)
  await page.getByRole('radio', { name: /upload a geojson file/i }).check()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'springs.geojson',
    mimeType: 'application/geo+json',
    buffer: Buffer.from(JSON.stringify(GEOJSON)),
  })
  await expect(page.getByText(/Selected: springs\.geojson/)).toBeVisible()

  const id = await submitAndReadId(page)

  const stored = await readChallenge(request, id)
  expect(stored.name).toBe(name)
  expect(stored.overpassQL ?? '').toBe('')
  expect(stored.remoteGeoJson ?? '').toBe('')

  await expect
    .poll(
      async () => {
        const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${id}/tasks?limit=10`)
        return ((await response.json()) as Task[]).length
      },
      { timeout: 30_000 }
    )
    .toBe(1)
})

test('a second challenge with the same name is refused and the form stays open', async ({
  page,
  request,
  project,
  challenge,
}) => {
  await openCreateForm(page, project.id)
  await fillRequiredFields(page, challenge.name)

  await page.getByRole('button', { name: 'Create Challenge' }).click()

  await expect(page.getByText('Challenge could not be created')).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByText('A challenge with this name already exists in this project')
  ).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(
    `Challenge with name ${challenge.name} already exists`
  )
  await expect(page).toHaveURL(/\/manage\/challenge\/new/)
  await expect(page.getByLabel('Name')).toHaveValue(challenge.name)
  expect((await listProjectChallenges(request, project.id)).map((c) => c.id)).toEqual([
    challenge.id,
  ])
})
