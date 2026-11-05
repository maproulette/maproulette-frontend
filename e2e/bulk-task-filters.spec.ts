import { readFile } from 'node:fs/promises'
import type { APIRequestContext, Page } from '@playwright/test'
import type { TaskGetResponse } from '@/types/Task'
import { BACKEND_URL } from './fixtures'
import { expect, test } from './helpers/misc'

const taskRow = (page: Page, id: number) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: String(id), exact: true }) })

const idColumn = async (page: Page) =>
  (await page.locator('tbody tr td:nth-child(3)').allInnerTexts()).map(Number)

const setStatus = async (request: APIRequestContext, taskId: number, status: number) => {
  const task = (await (
    await request.get(`${BACKEND_URL}/api/v2/task/${taskId}`)
  ).json()) as TaskGetResponse
  const response = await request.put(`${BACKEND_URL}/api/v2/tasks`, {
    data: [{ ...task, id: String(taskId), status }],
  })
  expect(response.ok()).toBe(true)
}

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

  await page.getByRole('button', { name: 'Status' }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Created' }).click()
  await page.keyboard.press('Escape')

  await expect(page.getByText('Showing 1 of 1 task')).toBeVisible()
  await expect(taskRow(page, fixed.id)).toBeVisible()
  await expect(taskRow(page, created.id)).not.toBeVisible()
  await expect(taskRow(page, alsoCreated.id)).not.toBeVisible()

  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(page.getByText('Showing 3 of 3 tasks')).toBeVisible()
  await expect(taskRow(page, created.id)).toBeVisible()
})

test('the task table sorts by id and status in either direction', async ({
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

  await page.getByRole('button', { name: 'Desc', exact: true }).click()
  await expect.poll(() => idColumn(page)).toEqual([...ids].sort((a, b) => a - b))

  await page.getByRole('combobox').filter({ hasText: 'ID' }).click()
  await page.getByRole('option', { name: 'Status' }).click()
  await expect.poll(() => idColumn(page)).toEqual([taskSet[1].id, taskSet[2].id, taskSet[0].id])

  await page.getByRole('button', { name: 'Asc', exact: true }).click()
  await expect.poll(() => idColumn(page)).toEqual([taskSet[0].id, taskSet[2].id, taskSet[1].id])
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
  const popover = page.getByRole('dialog', { name: 'Filter by property' })
  await popover.getByPlaceholder('property').fill('kind')
  await popover.getByPlaceholder('value').fill('road')
  await popover.getByRole('button', { name: 'Apply' }).click()

  await expect(page.getByText('Showing 2 of 2 tasks')).toBeVisible({ timeout: 15_000 })
  await expect(taskRow(page, road.id)).toBeVisible()
  await expect(taskRow(page, otherRoad.id)).toBeVisible()
  await expect(taskRow(page, river.id)).not.toBeVisible()

  await page.getByRole('button', { name: /Filter by property/ }).click()
  await popover.getByRole('button', { name: 'Clear' }).click()
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

  await page.getByRole('button', { name: 'Status' }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Created' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Showing 1 of 1 task')).toBeVisible()

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
