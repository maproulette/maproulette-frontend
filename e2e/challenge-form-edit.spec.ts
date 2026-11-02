import type { Page } from '@playwright/test'
import {
  BASEMAP_IDENTIFIED,
  BASEMAP_NONE,
  expect,
  pickOption,
  readChallenge,
  readChallengeKeywords,
  readTask,
  test,
  updateChallenge,
} from './helpers/challenge'

async function openEditForm(page: Page, challengeId: number, name: string) {
  await page.goto(`/manage/challenge/${challengeId}/edit`)
  await expect(page.getByRole('heading', { name: 'Challenge Editor' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByLabel('Name')).toHaveValue(name, { timeout: 15_000 })
}

async function saveEdits(page: Page, challengeId: number) {
  await page.getByRole('button', { name: 'Update Challenge' }).click()
  await expect(page).toHaveURL(new RegExp(`/manage/challenge/${challengeId}$`), {
    timeout: 30_000,
  })
}

test('editing every field saves each one and the form reloads with them', async ({
  page,
  request,
  challenge,
  team,
}) => {
  const name = `${challenge.name} (edited)`
  await openEditForm(page, challenge.id, challenge.name)

  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Description').fill('Edited description.')
  await page.getByLabel('Instructions').fill('Edited instructions for {{name}}.')
  await pickOption(page, 'Difficulty', 'Easy')
  await pickOption(page, 'How should your Challenge be Categorized?', 'Transit')
  await page.getByLabel('Additional Categorization Keywords').fill('e2e-edited')
  await page.getByLabel('Changeset comment').fill('Edited changeset')
  await page.getByLabel('Changeset source').fill('Mapillary')
  await page.getByRole('button', { name: new RegExp(team.name) }).click()
  await pickOption(page, 'Challenge basemap', 'Esri World Imagery')
  await page.getByLabel('OSM/External Id Property').fill('osm_ref')
  await page.getByLabel('Task Bundle Id Property').fill('group')

  await saveEdits(page, challenge.id)

  expect(await readChallenge(request, challenge.id)).toMatchObject({
    name,
    description: 'Edited description.',
    instruction: 'Edited instructions for {{name}}.',
    difficulty: 1,
    checkinComment: 'Edited changeset',
    checkinSource: 'Mapillary',
    ownerTeamId: team.id,
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Esri World Imagery',
    osmIdProperty: 'osm_ref',
    taskBundleIdProperty: 'group',
  })
  expect(await readChallengeKeywords(request, challenge.id)).toEqual([
    'e2e-edited',
    'public_transport',
    'railway',
  ])

  await openEditForm(page, challenge.id, name)
  await expect(page.getByLabel('Description')).toHaveValue('Edited description.')
  await expect(page.getByLabel('Instructions')).toHaveValue('Edited instructions for {{name}}.')
  await expect(page.getByLabel('Changeset comment')).toHaveValue('Edited changeset')
  await expect(page.getByLabel('Changeset source')).toHaveValue('Mapillary')
  await expect(page.getByLabel('OSM/External Id Property')).toHaveValue('osm_ref')
  await expect(page.getByLabel('Task Bundle Id Property')).toHaveValue('group')
  await expect(page.getByRole('button', { name: new RegExp(team.name) })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
})

test('renaming a challenge leaves its other settings alone', async ({
  page,
  request,
  challenge,
  team,
}) => {
  await updateChallenge(request, challenge.id, {
    difficulty: 3,
    ownerTeamId: team.id,
    osmIdProperty: '@id',
    taskBundleIdProperty: 'bundle',
  })
  const before = await readChallenge(request, challenge.id)

  await openEditForm(page, challenge.id, challenge.name)
  await page.getByLabel('Name').fill(`${challenge.name} renamed`)
  await saveEdits(page, challenge.id)

  const after = await readChallenge(request, challenge.id)
  expect(after.name).toBe(`${challenge.name} renamed`)
  expect(after).toMatchObject({
    description: before.description,
    instruction: before.instruction,
    difficulty: 3,
    checkinComment: before.checkinComment,
    checkinSource: before.checkinSource,
    ownerTeamId: team.id,
    osmIdProperty: '@id',
    taskBundleIdProperty: 'bundle',
    enabled: before.enabled,
    featured: before.featured,
    paused: before.paused,
  })
})

test('renaming a challenge keeps its basemap', async ({ page, request, challenge }) => {
  await updateChallenge(request, challenge.id, {
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Bing Aerial',
  })

  await openEditForm(page, challenge.id, challenge.name)
  await page.getByLabel('Name').fill(`${challenge.name} renamed`)
  await saveEdits(page, challenge.id)

  expect(await readChallenge(request, challenge.id)).toMatchObject({
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Bing Aerial',
  })
})

test('the edit form shows the stored difficulty and basemap', async ({
  page,
  request,
  challenge,
}) => {
  await updateChallenge(request, challenge.id, {
    difficulty: 1,
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Bing Aerial',
  })

  await openEditForm(page, challenge.id, challenge.name)

  await expect(page.getByLabel('Difficulty')).toHaveText('Easy')
  await expect(page.getByLabel('Challenge basemap')).toHaveText('Bing Aerial')
})

test('choosing not to override the basemap clears the stored one', async ({
  page,
  request,
  challenge,
}) => {
  await updateChallenge(request, challenge.id, {
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Bing Aerial',
  })

  await openEditForm(page, challenge.id, challenge.name)
  await pickOption(page, 'Challenge basemap', /Don't override/)
  await saveEdits(page, challenge.id)

  expect((await readChallenge(request, challenge.id)).defaultBasemap).toBe(BASEMAP_NONE)
})

test('choosing No team hands a team-owned challenge back', async ({
  page,
  request,
  challenge,
  team,
}) => {
  await updateChallenge(request, challenge.id, { ownerTeamId: team.id })

  await openEditForm(page, challenge.id, challenge.name)
  const noTeam = page.getByRole('button', { name: /No team/ })
  await expect(page.getByRole('button', { name: new RegExp(team.name) })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await noTeam.click()
  await expect(noTeam).toHaveAttribute('aria-pressed', 'true')
  await saveEdits(page, challenge.id)

  expect((await readChallenge(request, challenge.id)).ownerTeamId ?? null).toBeNull()
})

test('a challenge whose tasks are built shows its task source read-only and keeps it on save', async ({
  page,
  request,
  challenge,
  task,
}) => {
  await openEditForm(page, challenge.id, challenge.name)

  await expect(page.getByText('Uploaded GeoJSON file', { exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: /upload a geojson file/i })).toHaveCount(0)
  await page.getByLabel('Description').fill('Edited with tasks in place.')
  await saveEdits(page, challenge.id)

  expect((await readTask(request, task.id)).parent).toBe(challenge.id)
  expect((await readChallenge(request, challenge.id)).description).toBe(
    'Edited with tasks in place.'
  )
})

test('an edit with a required field emptied is not saved', async ({ page, request, challenge }) => {
  const before = await readChallenge(request, challenge.id)
  await openEditForm(page, challenge.id, challenge.name)

  await page.getByLabel('Instructions').fill('')
  await page.getByLabel('Changeset source').fill('   ')
  await page.getByRole('button', { name: 'Update Challenge' }).click()

  await expect(page.getByText('Instructions are required').first()).toBeVisible()
  await expect(page.getByText('A changeset source is required').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '2 fields need attention' })).toBeVisible()
  await expect(page).toHaveURL(/\/edit$/)

  const after = await readChallenge(request, challenge.id)
  expect(after.instruction).toBe(before.instruction)
  expect(after.checkinSource).toBe(before.checkinSource)
})

test('cancelling an edit returns to the challenge without saving', async ({
  page,
  request,
  challenge,
}) => {
  await openEditForm(page, challenge.id, challenge.name)
  await page.getByLabel('Name').fill(`${challenge.name} never saved`)

  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page).toHaveURL(new RegExp(`/manage/challenge/${challenge.id}$`))
  expect((await readChallenge(request, challenge.id)).name).toBe(challenge.name)
})

test('the update button stays disabled until something changes', async ({ page, challenge }) => {
  await openEditForm(page, challenge.id, challenge.name)
  const update = page.getByRole('button', { name: 'Update Challenge' })

  await expect(update).toBeDisabled()
  await page.getByLabel('Description').fill('Something new')
  await expect(update).toBeEnabled()
})

test('renaming a challenge keeps its keywords', async ({ page, request, challenge }) => {
  await updateChallenge(request, challenge.id, { tags: ['natural', 'water', 'e2e-kept'] })

  await openEditForm(page, challenge.id, challenge.name)
  await page.getByLabel('Name').fill(`${challenge.name} renamed`)
  await saveEdits(page, challenge.id)

  expect(await readChallengeKeywords(request, challenge.id)).toEqual([
    'e2e-kept',
    'natural',
    'water',
  ])
})

test('the edit form shows the stored category and keywords', async ({
  page,
  request,
  challenge,
}) => {
  await updateChallenge(request, challenge.id, { tags: ['natural', 'water', 'e2e-kept'] })

  await openEditForm(page, challenge.id, challenge.name)

  await expect(page.getByLabel('How should your Challenge be Categorized?')).toHaveText('Water')
  await expect(page.getByLabel('Additional Categorization Keywords')).toHaveValue('e2e-kept')
})
