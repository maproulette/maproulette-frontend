import { expect, test } from './fixtures'

// Requires E2E_REVIEWER_API_KEY (a second, real backend identity) to exercise
// the two-user lock-conflict path — see the REVIEWER_KEY comment in
// e2e/fixtures.ts for how to provision one. Skipped rather than failing when
// it's not configured, matching the pattern in e2e/super-admin.spec.ts.
if (process.env.E2E_REVIEWER_API_KEY) {
  test('a second user is told a task is locked when they open it after the first user', async ({
    page,
    reviewerPage,
    task,
  }) => {
    test.setTimeout(30_000)

    // The primary user opens the task and auto-locks it for mapping.
    await page.goto(`/tasks/${task.id}`)
    await expect(page.getByRole('button', { name: 'Fixed', exact: true })).toBeVisible({
      timeout: 20_000,
    })

    // A second, distinct real user opens the same task while it's still locked.
    await reviewerPage.goto(`/tasks/${task.id}`)
    await expect(
      reviewerPage.getByText(
        'This task is currently locked by another mapper. Try again later or pick a different task.'
      )
    ).toBeVisible({ timeout: 20_000 })
  })
} else {
  test.skip('a second user is told a task is locked when they open it after the first user', async () => {})
}
