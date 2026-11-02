import type { Page } from '@playwright/test'
import {
  createPropertyTask,
  expect,
  PRIORITY_HIGH,
  PRIORITY_LOW,
  PRIORITY_MEDIUM,
  readChallenge,
  readTask,
  test,
  uniqueName,
} from './helpers/challenge'

async function openPrioritization(page: Page, challengeId: number) {
  await page.goto(`/manage/challenge/${challengeId}/prioritization`)
  await expect(page.getByText('Default priority')).toBeVisible({ timeout: 20_000 })
}

test('a property rule makes matching tasks high priority and the rest take the default', async ({
  page,
  request,
  challenge,
}) => {
  const urgent = await createPropertyTask(request, challenge.id, uniqueName('e2e-urgent'), {
    kind: 'urgent',
  })
  const routine = await createPropertyTask(request, challenge.id, uniqueName('e2e-routine'), {
    kind: 'routine',
  })

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
    .poll(async () => [
      (await readTask(request, urgent.id)).priority,
      (await readTask(request, routine.id)).priority,
    ])
    .toEqual([PRIORITY_HIGH, PRIORITY_LOW])
})

test('a saved rule is shown again when the page is reopened', async ({
  page,
  request,
  challenge,
}) => {
  await createPropertyTask(request, challenge.id, uniqueName('e2e-task'), { kind: 'urgent' })

  await openPrioritization(page, challenge.id)
  await page.getByRole('radio', { name: 'Medium' }).check()
  await page.getByRole('tab', { name: /High/ }).click()
  await page.getByPlaceholder('property').first().fill('kind')
  await page.getByPlaceholder('value').first().fill('urgent')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page).toHaveURL(new RegExp(`/manage/challenge/${challenge.id}$`), {
    timeout: 15_000,
  })
  expect((await readChallenge(request, challenge.id)).defaultPriority).toBe(PRIORITY_MEDIUM)

  await openPrioritization(page, challenge.id)
  await expect(page.getByRole('radio', { name: 'Medium' })).toBeChecked()
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
