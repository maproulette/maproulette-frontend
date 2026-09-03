import { expect, test } from './fixtures'

test('a user can start mapping a challenge from its challenge page', async ({
  page,
  challenge,
  task,
}) => {
  test.setTimeout(60_000)

  await page.goto(`/challenge/${challenge.id}`)

  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('E2E test challenge')).toBeVisible({ timeout: 15_000 })

  // "Start Challenge" asks the backend for a task to work on and navigates to
  // it, which is the normal way into the mapping workspace (task-workflow.spec.ts
  // enters by task URL instead).
  await page.getByRole('button', { name: 'Start Challenge' }).click()

  await expect(page).toHaveURL(new RegExp(`/tasks/${task.id}`), { timeout: 30_000 })
  await expect(page.getByText(`Task #${task.id}`).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Fix the identified issue.')).toBeVisible({ timeout: 15_000 })

  // Deliberately not asserting that the task arrives already locked: this
  // navigation claims the task with `claimTask=true`, and the backend really
  // does claim it (the request goes out and succeeds), but against the Vite
  // dev server React StrictMode remounts the provider that issued the claim,
  // so the callbacks that flip the panel into its locked state are dropped
  // and the panel can still offer "Map this task". Asserting locked state
  // here would test a dev-mode remount timing, not the app's behavior — the
  // lock-driven UI is covered from a task URL in task-workflow.spec.ts.
})

test('a user can comment on a challenge and see it in the comments modal', async ({
  page,
  challenge,
}) => {
  const commentText = `E2E challenge comment ${Date.now()}`

  await page.goto(`/challenge/${challenge.id}`)

  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Comments', exact: true }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Challenge Comments' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(dialog.getByText('No comments yet. Be the first to comment!')).toBeVisible()

  await dialog.getByPlaceholder('Add a comment...').fill(commentText)
  await dialog.getByRole('button', { name: 'Send' }).click()

  await expect(dialog.getByText(commentText)).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByText('No comments yet. Be the first to comment!')).not.toBeVisible()

  // Reopening the modal on a freshly loaded page reads the comment back from
  // the server rather than from the mutation's own cache update.
  await page.goto(`/challenge/${challenge.id}?comments=1`)
  await expect(page.getByRole('dialog').getByText(commentText)).toBeVisible({ timeout: 20_000 })
})
