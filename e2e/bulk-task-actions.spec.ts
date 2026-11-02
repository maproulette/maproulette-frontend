import type { Page } from '@playwright/test'
import { expect, storedTasks, test } from './helpers/misc'

const taskRow = (page: Page, id: number) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: String(id), exact: true }) })

const selectRows = async (page: Page, ids: number[]) => {
  for (const id of ids) {
    await taskRow(page, id).getByRole('checkbox', { name: 'Select row for bulk actions' }).click()
  }
}

const openChallengeTasks = async (page: Page, challengeId: number, taskIds: number[]) => {
  await page.goto(`/manage/challenge/${challengeId}`)
  for (const id of taskIds) {
    await expect(taskRow(page, id)).toBeVisible({ timeout: 20_000 })
  }
}

test('selected tasks can be given a new status, leaving the rest alone', async ({
  page,
  request,
  challenge,
  taskSet,
}) => {
  const [first, second, untouched] = taskSet
  await openChallengeTasks(
    page,
    challenge.id,
    taskSet.map((t) => t.id)
  )

  await selectRows(page, [first.id, second.id])
  await expect(page.getByText('2 selected')).toBeVisible()

  await page.getByRole('button', { name: 'Change status' }).click()
  await page.getByRole('menuitem', { name: 'Pick a status…' }).click()

  const dialog = page.getByRole('dialog', { name: 'Change task status' })
  await dialog.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Already Fixed' }).click()
  await dialog.getByRole('button', { name: 'Apply' }).click()

  await expect(page.getByText('Updated 2 tasks')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('2 selected')).not.toBeVisible()

  await expect(taskRow(page, first.id)).toContainText('Already Fixed', { timeout: 15_000 })
  await expect(taskRow(page, second.id)).toContainText('Already Fixed')
  await expect(taskRow(page, untouched.id)).toContainText('Created')

  const stored = await storedTasks(request, challenge.id)
  expect(stored.get(first.id)?.status).toBe(5)
  expect(stored.get(second.id)?.status).toBe(5)
  expect(stored.get(untouched.id)?.status).toBe(0)
})

test('selected tasks can be archived and unarchived', async ({
  page,
  request,
  challenge,
  taskSet,
}) => {
  const [archived, untouched] = taskSet
  await openChallengeTasks(
    page,
    challenge.id,
    taskSet.map((t) => t.id)
  )

  await selectRows(page, [archived.id])
  await page.getByRole('button', { name: 'Archive' }).click()
  await page.getByRole('menuitem', { name: 'Archive', exact: true }).click()
  await expect(page.getByText('Archived 1 task')).toBeVisible({ timeout: 15_000 })

  let stored = await storedTasks(request, challenge.id)
  expect(stored.get(archived.id)?.archived).toBe(true)
  expect(stored.get(untouched.id)?.archived).toBe(false)

  await selectRows(page, [archived.id])
  await page.getByRole('button', { name: 'Archive' }).click()
  await page.getByRole('menuitem', { name: 'Unarchive' }).click()
  await expect(page.getByText('Unarchived 1 task')).toBeVisible({ timeout: 15_000 })

  stored = await storedTasks(request, challenge.id)
  expect(stored.get(archived.id)?.archived).toBe(false)
})

test('selected tasks can be deleted after confirming, and only those are removed', async ({
  page,
  request,
  challenge,
  taskSet,
}) => {
  const [doomed, kept, alsoKept] = taskSet
  await openChallengeTasks(
    page,
    challenge.id,
    taskSet.map((t) => t.id)
  )

  await selectRows(page, [doomed.id])
  await page.getByRole('button', { name: 'Delete' }).click()

  const dialog = page.getByRole('dialog', { name: 'Delete 1 task?' })
  await expect(dialog).toContainText('This cannot be undone.')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).not.toBeVisible()
  expect((await storedTasks(request, challenge.id)).has(doomed.id)).toBe(true)

  await page.getByRole('button', { name: 'Delete' }).click()
  await dialog.getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByText('Deleted 1 task')).toBeVisible({ timeout: 15_000 })
  await expect(taskRow(page, doomed.id)).not.toBeVisible({ timeout: 15_000 })
  await expect(taskRow(page, kept.id)).toBeVisible()
  await expect(page.getByText('Showing 2 of 2 tasks')).toBeVisible()

  const stored = await storedTasks(request, challenge.id)
  expect([...stored.keys()].sort()).toEqual([kept.id, alsoKept.id].sort())
})

test('select all picks every visible task, and Clear drops the selection', async ({
  page,
  challenge,
  taskSet,
}) => {
  await openChallengeTasks(
    page,
    challenge.id,
    taskSet.map((t) => t.id)
  )

  const selectAll = page.getByRole('checkbox', { name: 'Select all visible tasks' })
  await selectAll.click()
  await expect(page.getByText('3 selected')).toBeVisible()
  for (const task of taskSet) {
    await expect(
      taskRow(page, task.id).getByRole('checkbox', { name: 'Deselect row for bulk actions' })
    ).toBeChecked()
  }

  await taskRow(page, taskSet[0].id)
    .getByRole('checkbox', { name: 'Deselect row for bulk actions' })
    .click()
  await expect(page.getByText('2 selected')).toBeVisible()
  await expect(selectAll).not.toBeChecked()

  await page.getByRole('button', { name: 'Clear', exact: true }).last().click()
  await expect(page.getByText('2 selected')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Change status' })).not.toBeVisible()
})
