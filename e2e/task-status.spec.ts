import { expect, test } from './fixtures'

// task-workflow.spec.ts covers the "Fixed" path. This covers a *non*-fixed
// resolution, which behaves differently in three ways worth exercising: it
// carries a comment along with the status change, it leaves the task in a
// status the app treats as non-editable (so the completion buttons give way to
// navigation actions), and it's the one resolution the app still allows to be
// corrected afterwards (falsePositive → fixed).
test('a user can mark a task as Not an Issue with a comment, and it sticks', async ({
  page,
  task,
}) => {
  test.setTimeout(60_000)

  const commentText = `Not an issue because of E2E ${Date.now()}`

  await page.goto(`/tasks/${task.id}`)

  await page.getByRole('button', { name: 'Map this task' }).click()

  const notAnIssueButton = page.getByRole('button', { name: 'Not an Issue' })
  await expect(notAnIssueButton).toBeVisible({ timeout: 20_000 })
  await notAnIssueButton.click()

  await expect(page.getByRole('heading', { name: 'Complete Task Action' })).toBeVisible({
    timeout: 10_000,
  })

  await page.getByLabel('Comment (Optional)').fill(commentText)
  await page.getByRole('button', { name: 'Complete & Continue' }).click()

  await expect(page.getByText('Task marked as Not an Issue')).toBeVisible({ timeout: 15_000 })

  // Reopening the task from scratch (rather than reading the page we just
  // acted on) proves the status and comment were persisted server-side.
  await page.goto(`/tasks/${task.id}`)

  await expect(page.getByText('Not an Issue').first()).toBeVisible({ timeout: 20_000 })

  // A task that is not an issue is no longer editable, so the completion
  // buttons are replaced by the "map something else" navigation actions.
  await expect(page.getByText('Want to map this challenge?')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Fixed', exact: true })).not.toBeVisible()

  // Both the status change and the comment submitted with it land in the
  // task's activity feed.
  await page.getByRole('tab', { name: /Comments \(1\)/ }).click()
  await expect(page.getByText(commentText)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Created').first()).toBeVisible()
})
