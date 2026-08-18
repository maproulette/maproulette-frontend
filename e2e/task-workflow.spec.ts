import { expect, test } from './fixtures'

test('a user can open a task, view its details, and mark it as fixed', async ({
  page,
  task,
  challenge,
}) => {
  test.setTimeout(60_000)

  await page.goto(`/tasks/${task.id}`)

  // Task details are visible: the task identity and the challenge's instructions
  // (the task page shows the challenge's instruction text, substituted with task
  // properties, in its "Task" instruction tab).
  await expect(page.getByText(`Task #${task.id}`).first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Fix the identified issue.')).toBeVisible({ timeout: 15_000 })

  // Opening a task URL directly no longer auto-claims it (only in-app
  // navigation with claimTask=true does); clicking "Map this task" locks it,
  // at which point the completion action buttons replace that prompt.
  await page.getByRole('button', { name: 'Map this task' }).click()
  const fixedButton = page.getByRole('button', { name: 'Fixed', exact: true })
  await expect(fixedButton).toBeVisible({ timeout: 20_000 })
  await fixedButton.click()

  // Confirm the status change in the completion modal
  await expect(page.getByRole('heading', { name: 'Complete Task Action' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Complete & Continue' }).click()

  // A success toast confirms the status change was applied
  await expect(page.getByText('Task marked as Fixed')).toBeVisible({ timeout: 15_000 })

  // Completing a task can pop up one or more congratulatory modals (points,
  // achievement, level up, streak, etc., shown one at a time) that cover the
  // page; dismiss all of them so they don't block the assertions below.
  const congratulateCloseButton = page.getByRole('dialog').getByRole('button', { name: /close/i })
  for (let i = 0; i < 5; i++) {
    if (!(await congratulateCloseButton.isVisible({ timeout: 2_000 }).catch(() => false))) break
    await congratulateCloseButton.click()
  }

  // This is the only task in the challenge, so once it's Fixed there is no
  // other task to load next, and the app returns to the challenge page.
  await expect(page.getByText('No more tasks available in this challenge')).toBeVisible({
    timeout: 15_000,
  })
  // The map view appends a `#zoom/lat/lng` hash once it settles, so match the
  // path rather than requiring an exact end-of-string.
  await expect(page).toHaveURL(new RegExp(`/challenge/${challenge.id}(#|$)`), { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({
    timeout: 15_000,
  })
})
