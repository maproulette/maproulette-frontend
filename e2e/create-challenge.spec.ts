import { expect, test } from './fixtures'

const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-95.454772, 37.6866588] },
      properties: { name: 'E2E test task' },
    },
  ],
}

// Only verifies the create-challenge form submits successfully with a GeoJSON
// upload. It does not verify that the uploaded tasks are actually imported —
// see the note in fixtures.ts about the backend's async import bug.
test('a user can submit the create-challenge form with a local GeoJSON file', async ({
  page,
  project,
}) => {
  await page.goto(`/manage/challenge/new?projectId=${project.id}`)

  const heading = page.getByRole('heading', { name: 'Create New Challenge' })
  await expect(heading).toBeVisible({ timeout: 15_000 })

  await page.getByLabel('Name').fill('E2E test challenge')
  await page.getByLabel('Description').fill('Created by the create-challenge E2E test.')
  await page.getByLabel('Instructions').fill('Verify the task and mark it as fixed.')

  await page.getByRole('radio', { name: /upload a geojson file/i }).check()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'tasks.geojson',
    mimeType: 'application/geo+json',
    buffer: Buffer.from(JSON.stringify(GEOJSON)),
  })

  await page.getByRole('checkbox', { name: /automated edits code of conduct/i }).check()

  const submit = page.getByRole('button', { name: 'Create Challenge' })
  await submit.click()

  await expect(page).toHaveURL(/\/manage\/challenge\/\d+$/, { timeout: 30_000 })
  await expect(heading).not.toBeVisible()
  await expect(submit).not.toBeVisible()
})
