import { createChallenge } from './fixtures'
import { expect, readChallenge, test } from './helpers/challenge'

test('bulk editing overwrites the instructions of every selected challenge and nothing else', async ({
  page,
  request,
  project,
  challenge,
}) => {
  const [second, untouched] = await Promise.all([
    createChallenge(request, project.id),
    createChallenge(request, project.id),
  ])
  const instruction = `Bulk instructions ${Date.now()}`

  await page.goto(`/manage/project/${project.id}`)
  const editSelected = page.getByRole('button', { name: /Edit .*selected challenge/ })
  await expect(editSelected).toBeDisabled({ timeout: 20_000 })

  await page.getByRole('checkbox', { name: `Select ${challenge.name}` }).click()
  await page.getByRole('checkbox', { name: `Select ${second.name}` }).click()
  await expect(page.getByRole('button', { name: 'Edit 2 selected challenges' })).toBeEnabled()
  await page.getByRole('button', { name: 'Edit 2 selected challenges' }).click()

  await expect(page).toHaveURL(/\/challenges\/bulk-edit/, { timeout: 15_000 })
  await expect(page.getByText(challenge.name)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(second.name)).toBeVisible()
  await expect(page.getByText('Filled-in fields overwrite each challenge')).toBeVisible()

  await page.getByRole('textbox', { name: 'Instructions' }).fill(instruction)
  await page.getByRole('button', { name: 'Review changes' }).click()

  const confirm = page.getByRole('dialog', { name: 'Confirm bulk edit' })
  await expect(confirm.getByText(instruction)).toBeVisible({ timeout: 10_000 })
  await confirm.getByRole('button', { name: 'Submit bulk edit' }).click()

  await expect(page.getByText('Updated 2 challenges')).toBeVisible({ timeout: 20_000 })
  await expect(page).toHaveURL(new RegExp(`/manage/project/${project.id}$`))

  const stored = await Promise.all(
    [challenge.id, second.id, untouched.id].map((id) => readChallenge(request, id))
  )
  expect(stored.map((c) => c.instruction)).toEqual([
    instruction,
    instruction,
    'Fix the identified issue.',
  ])
})

test('a challenge can be dropped from the bulk edit before submitting', async ({
  page,
  request,
  project,
  challenge,
}) => {
  const second = await createChallenge(request, project.id)
  const instruction = `Bulk instructions ${Date.now()}`

  await page.goto(
    `/manage/project/${project.id}/challenges/bulk-edit?challengeIds=${encodeURIComponent(
      JSON.stringify([challenge.id, second.id])
    )}`
  )
  await expect(page.getByText(second.name)).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: `Remove ${second.name} from this edit` }).click()
  await expect(page.getByText(second.name)).not.toBeVisible()

  await page.getByRole('textbox', { name: 'Instructions' }).fill(instruction)
  await page.getByRole('button', { name: 'Review changes' }).click()
  await page
    .getByRole('dialog', { name: 'Confirm bulk edit' })
    .getByRole('button', { name: 'Submit bulk edit' })
    .click()

  await expect(page.getByText('Updated 1 challenge')).toBeVisible({ timeout: 20_000 })
  expect((await readChallenge(request, challenge.id)).instruction).toBe(instruction)
  expect((await readChallenge(request, second.id)).instruction).toBe('Fix the identified issue.')
})
