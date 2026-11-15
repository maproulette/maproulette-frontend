import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { setTaskStatus as setStatus } from './helpers/challengeSources'
import { expect, taskRow, test } from './helpers/misc'

const filterBar = (page: Page) => page.getByRole('group', { name: 'Task filters' })

const sortBy = (page: Page, column: string) =>
  page
    .getByRole('columnheader', { name: column })
    .getByRole('button', { name: column, exact: true })
    .click()

const idColumn = async (page: Page) =>
  (await page.locator('tbody tr td:nth-child(2)').allInnerTexts()).map(Number)

test('the status filter narrows the table and Clear brings every task back', async ({
  page,
  request,
  challenge,
  taskSet,
}) => {
  const [fixed, created, alsoCreated] = taskSet
  await setStatus(request, fixed.id, 1)

  await page.goto(`/manage/challenge/${challenge.id}`)
  await expect(page.getByText('Showing 3 of 3 tasks')).toBeVisible({ timeout: 20_000 })
  await expect(taskRow(page, fixed.id)).toContainText('Fixed')

  await filterBar(page).getByRole('button', { name: 'Status' }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Created' }).click()
  await page.keyboard.press('Escape')

  await expect(page.getByText('Showing 1 of 3 tasks')).toBeVisible()
  await expect(taskRow(page, fixed.id)).toBeVisible()
  await expect(taskRow(page, created.id)).not.toBeVisible()
  await expect(taskRow(page, alsoCreated.id)).not.toBeVisible()

  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(page.getByText('Showing 3 of 3 tasks')).toBeVisible()
  await expect(taskRow(page, created.id)).toBeVisible()
})

test('clicking a column header cycles its sort through ascending, descending and back to the default', async ({
  page,
  request,
  challenge,
  taskSet,
}) => {
  const ids = taskSet.map((t) => t.id)
  await setStatus(request, taskSet[0].id, 6)
  await setStatus(request, taskSet[2].id, 1)

  await page.goto(`/manage/challenge/${challenge.id}`)
  await expect(page.getByText('Showing 3 of 3 tasks')).toBeVisible({ timeout: 20_000 })

  await expect.poll(() => idColumn(page)).toEqual([...ids].sort((a, b) => b - a))

  await sortBy(page, 'ID')
  await expect.poll(() => idColumn(page)).toEqual([...ids].sort((a, b) => a - b))

  await sortBy(page, 'Status')
  await expect.poll(() => idColumn(page)).toEqual([taskSet[1].id, taskSet[2].id, taskSet[0].id])

  await sortBy(page, 'Status')
  await expect.poll(() => idColumn(page)).toEqual([taskSet[0].id, taskSet[2].id, taskSet[1].id])

  await sortBy(page, 'Status')
  await expect.poll(() => idColumn(page)).toEqual([...ids].sort((a, b) => b - a))
})

test('the property filter shows only tasks whose feature matches', async ({
  page,
  challenge,
  taskSet,
}) => {
  const [road, river, otherRoad] = taskSet
  await page.goto(`/manage/challenge/${challenge.id}`)
  await expect(page.getByText('Showing 3 of 3 tasks')).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Filter by property' }).click()
  const dialog = page.getByRole('dialog', { name: 'Filter tasks by feature property' })
  await dialog.getByPlaceholder('property').fill('kind')
  await dialog.getByPlaceholder('value').fill('road')
  await dialog.getByRole('button', { name: 'Apply' }).click()

  await expect(page.getByText('Showing 2 of 3 tasks')).toBeVisible({
    timeout: 15_000,
  })
  await expect(taskRow(page, road.id)).toBeVisible()
  await expect(taskRow(page, otherRoad.id)).toBeVisible()
  await expect(taskRow(page, river.id)).not.toBeVisible()

  await page.getByRole('button', { name: /Filter by property/ }).click()
  await dialog.getByRole('button', { name: 'Clear' }).click()
  await expect(page.getByText('Showing 3 of 3 tasks')).toBeVisible({ timeout: 15_000 })
})

test('exporting tasks downloads a CSV holding only the filtered tasks', async ({
  page,
  request,
  challenge,
  taskSet,
}) => {
  const [fixed, created] = taskSet
  await setStatus(request, fixed.id, 1)

  await page.goto(`/manage/challenge/${challenge.id}`)
  await expect(page.getByText('Showing 3 of 3 tasks')).toBeVisible({ timeout: 20_000 })

  await filterBar(page).getByRole('button', { name: 'Status' }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Created' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Showing 1 of 3 tasks')).toBeVisible()

  await page.getByRole('button', { name: 'Export' }).click()
  const dialog = page.getByRole('dialog', { name: 'Export tasks' })
  await expect(dialog.getByRole('radio', { name: 'CSV — one row per task' })).toBeChecked()

  const downloadPromise = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Download' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe(`${challenge.name}.csv`)

  const csv = await readFile(await download.path(), 'utf-8')
  expect(csv).toContain(fixed.name)
  expect(csv).not.toContain(created.name)
  await expect(dialog).not.toBeVisible()
})
