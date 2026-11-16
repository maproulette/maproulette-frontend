import { createTask, uniqueName } from './fixtures'
import {
  expect,
  openPrioritization,
  PRIORITY_HIGH,
  PRIORITY_LOW,
  readChallenge,
  test,
} from './helpers/challenge'
import { getTask } from './helpers/task'

test('a property rule makes matching tasks high priority and the rest take the default', async ({
  page,
  request,
  challenge,
}) => {
  const [urgent, routine] = await Promise.all([
    createTask(request, challenge.id, {
      name: uniqueName('e2e-urgent'),
      properties: { kind: 'urgent' },
    }),
    createTask(request, challenge.id, {
      name: uniqueName('e2e-routine'),
      properties: { kind: 'routine' },
    }),
  ])

  await openPrioritization(page, challenge.id)
  await page.getByRole('radio', { name: 'Low' }).check()
  await page.getByRole('tab', { name: /High/ }).click()
  await page.getByPlaceholder('property').first().fill('kind')
  await page.getByPlaceholder('value').first().fill('urgent')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Priorities saved')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(new RegExp(`/manage/challenge/${challenge.id}$`))

  const stored = await readChallenge(request, challenge.id)
  expect(stored.defaultPriority).toBe(PRIORITY_LOW)
  const rule = JSON.stringify(stored.highPriorityRule)
  expect(rule).toContain('kind')
  expect(rule).toContain('urgent')

  await expect
    .poll(async () =>
      (await Promise.all([getTask(request, urgent.id), getTask(request, routine.id)])).map(
        (task) => task.priority
      )
    )
    .toEqual([PRIORITY_HIGH, PRIORITY_LOW])

  await openPrioritization(page, challenge.id)
  await expect(page.getByRole('radio', { name: 'Low' })).toBeChecked()
  await page.getByRole('tab', { name: /High/ }).click()
  await expect(page.getByPlaceholder('property').first()).toHaveValue('kind')
  await expect(page.getByPlaceholder('value').first()).toHaveValue('urgent')
})

test('save is only offered once something changes, and discard puts the page back', async ({
  page,
  request,
  challenge,
}) => {
  const before = await readChallenge(request, challenge.id)
  await openPrioritization(page, challenge.id)
  const save = page.getByRole('button', { name: 'Save' })
  const discard = page.getByRole('button', { name: 'Discard' })
  const low = page.getByRole('radio', { name: 'Low' })

  await expect(save).toBeDisabled()
  await expect(discard).toBeDisabled()

  await low.check()
  await expect(save).toBeEnabled()
  await discard.click()

  await expect(low).not.toBeChecked()
  await expect(save).toBeDisabled()
  expect((await readChallenge(request, challenge.id)).defaultPriority).toBe(before.defaultPriority)
})

test('an integer priority rule is saved as integer, compares numerically and comes back as integer', async ({
  page,
  request,
  challenge,
}) => {
  const [wide, narrow] = await Promise.all([
    createTask(request, challenge.id, {
      name: uniqueName('e2e-wide'),
      properties: { lanes: '10' },
    }),
    createTask(request, challenge.id, {
      name: uniqueName('e2e-narrow'),
      properties: { lanes: '9' },
    }),
  ])

  await openPrioritization(page, challenge.id)
  await page.getByRole('radio', { name: 'Low' }).check()
  await page.getByRole('tab', { name: /High/ }).click()
  await page.getByPlaceholder('property').first().fill('lanes')
  await page
    .getByRole('combobox')
    .filter({ hasText: /^string$/ })
    .first()
    .click()
  await page.getByRole('option', { name: 'integer', exact: true }).click()
  await page
    .getByRole('combobox')
    .filter({ hasText: /^equals$/ })
    .first()
    .click()
  await page.getByRole('option', { name: 'greater than', exact: true }).click()
  await page.getByPlaceholder('value').first().fill('9')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Priorities saved')).toBeVisible({ timeout: 15_000 })

  const stored = JSON.stringify((await readChallenge(request, challenge.id)).highPriorityRule)
  expect(stored).toMatch(/type\W+integer\b/)

  await expect
    .poll(async () =>
      (await Promise.all([getTask(request, wide.id), getTask(request, narrow.id)])).map(
        (task) => task.priority
      )
    )
    .toEqual([PRIORITY_HIGH, PRIORITY_LOW])

  await openPrioritization(page, challenge.id)
  await page.getByRole('tab', { name: /High/ }).click()
  await expect(page.getByRole('combobox').filter({ hasText: /^integer$/ })).toHaveCount(1)
})
