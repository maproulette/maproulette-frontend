import { expect, test } from './fixtures'

test('a second user is told a task is locked when they open it after the first user', async ({
  page,
  reviewerPage,
  task,
}) => {
  test.setTimeout(30_000)

  // The primary user opens the task and locks it for mapping.
  await page.goto(`/tasks/${task.id}`)
  await page.getByRole('button', { name: 'Map this task' }).click()
  await expect(page.getByRole('button', { name: 'Fixed', exact: true })).toBeVisible({
    timeout: 20_000,
  })

  // A second, distinct real user opens the same task while it's still locked.
  await reviewerPage.goto(`/tasks/${task.id}`)
  await reviewerPage.getByRole('button', { name: 'Map this task' }).click()
  const dialog = reviewerPage.getByRole('dialog', { name: 'Unable to Lock Task' })
  await expect(dialog).toBeVisible({ timeout: 20_000 })
  await expect(dialog).toContainText('Task is currently locked by user e2e-super-user')
  await expect(dialog.getByRole('button', { name: 'Preview Task' })).toBeVisible()
})
