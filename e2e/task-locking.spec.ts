import { expect, test } from './fixtures'

test('a lock that fails for any other reason offers no unlock request', async ({ page, task }) => {
  await page.route('**/api/v2/task/*/start', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'KO', message: 'An unexpected error occurred' }),
    })
  )

  await page.goto(`/tasks/${task.id}`)
  await page.getByRole('button', { name: 'Map this task' }).click()
  const dialog = page.getByRole('dialog', { name: 'Unable to Lock Task' })
  await expect(dialog).toContainText('An unexpected error occurred', { timeout: 20_000 })
  await expect(dialog.getByRole('button', { name: 'Retry Lock' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Request Unlock' })).toHaveCount(0)
})
