import { expect, test } from './fixtures'

test('a user can comment on a task and see it in the task activity feed', async ({
  page,
  task,
}) => {
  const commentText = `E2E comment ${Date.now()}`

  await page.goto(`/tasks/${task.id}`)

  await expect(page.getByText(`Task #${task.id}`).first()).toBeVisible({ timeout: 15_000 })

  // The comments tab doubles as the task's activity feed (comments plus status
  // changes), and its label carries the comment count.
  const commentsTab = page.getByRole('tab', { name: /Comments \(0\)/ })
  await expect(commentsTab).toBeVisible({ timeout: 15_000 })
  await commentsTab.click()

  await expect(page.getByText('No activity yet. Be the first to comment!')).toBeVisible({
    timeout: 15_000,
  })

  const commentBox = page.getByPlaceholder('Add a comment...')
  await commentBox.fill(commentText)
  await page.getByRole('button', { name: 'Send comment' }).click()

  await expect(page.getByText('Comment added')).toBeVisible({ timeout: 15_000 })

  // The posted comment replaces the empty state in the feed, and the tab's
  // count reflects the refetched comment list rather than a local guess.
  await expect(page.getByText(commentText)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('tab', { name: /Comments \(1\)/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('No activity yet. Be the first to comment!')).not.toBeVisible()

  // The comment box is cleared for the next comment, and the comment survives
  // a reload (i.e. it was persisted, not just rendered optimistically).
  await expect(commentBox).toHaveValue('')

  await page.reload()
  await page.getByRole('tab', { name: /Comments \(1\)/ }).click()
  await expect(page.getByText(commentText)).toBeVisible({ timeout: 15_000 })
})
