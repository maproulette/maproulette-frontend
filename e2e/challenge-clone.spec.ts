import type { Page } from '@playwright/test'
import { uniqueName } from './fixtures'
import {
  BASEMAP_IDENTIFIED,
  expect,
  PRIORITY_LOW,
  readChallenge,
  readChallengeKeywords,
  test,
  updateChallenge,
} from './helpers/challenge'

const OVERPASS_QUERY = '[out:json];node["amenity"="bench"](37.68,-95.46,37.69,-95.45);out;'

async function cloneFromProjectPage(page: Page, projectId: number, challengeName: string) {
  await page.goto(`/manage/project/${projectId}`)
  await expect(page.getByText(challengeName)).toBeVisible({ timeout: 20_000 })
  await page.getByRole('radio', { name: 'List view' }).click()
  const row = page.getByRole('row', { name: challengeName })
  await row.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Clone challenge' }).click()
  await expect(page.getByRole('heading', { name: 'Clone Challenge' })).toBeVisible({
    timeout: 15_000,
  })
}

async function submitClone(page: Page, name: string): Promise<number> {
  await page.getByLabel('Name').fill(name)
  await page.getByRole('checkbox', { name: /automated edits code of conduct/i }).check()
  await page.getByRole('button', { name: 'Create Challenge' }).click()
  await expect(page).toHaveURL(/\/manage\/challenge\/\d+$/, { timeout: 30_000 })
  return Number(new URL(page.url()).pathname.split('/').pop())
}

test('the clone form starts from the source challenge with a blank name and its query commented out', async ({
  page,
  request,
  project,
  challenge,
}) => {
  await updateChallenge(request, challenge.id, {
    overpassQL: OVERPASS_QUERY,
    difficulty: 3,
    checkinSource: 'Esri',
  })
  const source = await readChallenge(request, challenge.id)

  await cloneFromProjectPage(page, project.id, challenge.name)

  await expect(page).toHaveURL(new RegExp(`cloneFrom=${challenge.id}`))
  await expect(page.getByLabel('Name')).toHaveValue('')
  await expect(page.getByLabel('Description')).toHaveValue(source.description ?? '')
  await expect(page.getByLabel('Instructions')).toHaveValue(source.instruction)
  await expect(page.getByLabel('Changeset comment')).toHaveValue(source.checkinComment)
  await expect(page.getByLabel('Changeset source')).toHaveValue('Esri')
  const query = page.getByRole('textbox', { name: 'Overpass QL' })
  await expect(query).toHaveValue(/^\/\*\nTHIS IS THE QUERY OF THE CHALLENGE YOU CLONED/)
  const clonedQuery = await query.inputValue()
  expect(clonedQuery.endsWith(`${OVERPASS_QUERY}\n*/`), clonedQuery).toBe(true)
  await expect(
    page.getByRole('checkbox', { name: /automated edits code of conduct/i })
  ).not.toBeChecked()
})

test('a clone copies the source settings into a new challenge and leaves the source alone', async ({
  page,
  request,
  project,
  challenge,
  team,
}) => {
  await updateChallenge(request, challenge.id, {
    overpassQL: OVERPASS_QUERY,
    difficulty: 3,
    checkinComment: 'Benches checked #maproulette',
    checkinSource: 'Esri',
    ownerTeamId: team.id,
    osmIdProperty: '@id',
    enabled: false,
    paused: true,
    featured: true,
    defaultPriority: PRIORITY_LOW,
    defaultZoom: 16,
    minZoom: 12,
    maxZoom: 18,
    requireConfirmation: true,
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Bing Aerial',
    tags: ['amenity', 'leisure', 'e2e-clone'],
  })
  const source = await readChallenge(request, challenge.id)

  await cloneFromProjectPage(page, project.id, challenge.name)
  const cloneName = uniqueName('e2e-clone')
  const cloneId = await submitClone(page, cloneName)

  expect(cloneId).not.toBe(challenge.id)
  const clone = await readChallenge(request, cloneId)
  expect(clone).toMatchObject({
    name: cloneName,
    parent: project.id,
    description: source.description,
    instruction: source.instruction,
    difficulty: 3,
    checkinComment: 'Benches checked #maproulette',
    checkinSource: 'Esri',
    ownerTeamId: team.id,
    osmIdProperty: '@id',
    enabled: false,
    paused: true,
    featured: true,
    defaultPriority: PRIORITY_LOW,
    defaultZoom: 16,
    minZoom: 12,
    maxZoom: 18,
    requireConfirmation: true,
    defaultBasemap: BASEMAP_IDENTIFIED,
    defaultBasemapId: 'Bing Aerial',
  })
  expect(await readChallengeKeywords(request, cloneId)).toEqual(['amenity', 'e2e-clone', 'leisure'])
  expect(clone.overpassQL).toContain('THIS IS THE QUERY OF THE CHALLENGE YOU CLONED')

  const after = await readChallenge(request, challenge.id)
  expect(after.name).toBe(challenge.name)
  expect(after.overpassQL).toBe(OVERPASS_QUERY)
})
