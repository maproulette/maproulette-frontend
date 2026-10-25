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
  await expect(
    reviewerPage.getByText(
      'This task is currently locked by another mapper. Try again later or pick a different task.'
    )
  ).toBeVisible({ timeout: 20_000 })
})
