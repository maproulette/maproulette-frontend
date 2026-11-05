import {
  completeTask,
  expect,
  getTask,
  getTaskComments,
  startMapping,
  storedTaskRow,
  TASK_STATUS,
  test,
} from './helpers/task'

test.describe.configure({ timeout: 60_000 })

test('skipping the only open task counts the skip, keeps its status and brings it back', async ({
  mapper,
  request,
  task,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)

  await page.getByRole('button', { name: 'Skip this task' }).click()

  await expect.poll(() => storedTaskRow(task.id).skipCount).toBe(1)
  expect((await getTask(request, task.id)).status).toBe(TASK_STATUS.created)
  await expect(page).toHaveURL(new RegExp(`/tasks/${task.id}(\\b|$)`))
  await expect(page.getByText(`Task #${task.id}`).first()).toBeVisible()
})

test("skipping a Can't Complete task keeps it Can't Complete and releases it", async ({
  mapper,
  request,
  task,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)
  await completeTask(page, "Can't Complete", { toast: "Can't Complete" })

  await startMapping(page, task.id)
  await page.getByText('Completion: Set Task Status').click()
  await page.keyboard.press('w')

  await expect(page.getByText('No more tasks available in this challenge')).toBeVisible({
    timeout: 15_000,
  })
  await expect.poll(() => storedTaskRow(task.id).skipCount).toBe(1)
  const stored = await getTask(request, task.id)
  expect(stored.status).toBe(TASK_STATUS.tooHard)
  expect(stored.lockedBy).toBeNull()
})

test('completing a task moves on to another task in the challenge, already locked', async ({
  mapper,
  request,
  task,
  extraTasks,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)
  await completeTask(page, 'Fixed', { toast: 'Fixed' })

  const remaining = extraTasks.map((t) => t.id)
  await expect(page).toHaveURL(new RegExp(`/tasks/(${remaining.join('|')})(\\b|$)`), {
    timeout: 20_000,
  })
  const nextId = Number(new URL(page.url()).pathname.split('/').pop())
  await expect(page.getByText('Completion: Set Task Status')).toBeVisible({ timeout: 20_000 })
  await expect.poll(async () => (await getTask(request, nextId)).lockedBy).toBe(mapper.user.id)
  expect((await getTask(request, task.id)).lockedBy).toBeNull()
})

test('leaving a task and coming back keeps the lock, and Unlock releases it', async ({
  mapper,
  request,
  task,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)
  await page.goto('/dashboard')
  await page.goto(`/tasks/${task.id}`)

  await expect(page.getByText('Completion: Set Task Status')).toBeVisible({ timeout: 20_000 })
  expect((await getTask(request, task.id)).lockedBy).toBe(mapper.user.id)

  await page.getByRole('button', { name: 'Unlock task' }).first().click()
  await expect(page.getByText('Task unlocked')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Map this task' })).toBeVisible()
  await expect.poll(async () => (await getTask(request, task.id)).lockedBy).toBeNull()
})

test('starting a second task offers to release the first one', async ({
  mapper,
  request,
  task,
  secondTask,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)

  await page.goto(`/tasks/${secondTask.id}`)
  await page.getByRole('button', { name: 'Map this task' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText(`task #${task.id}`, { timeout: 15_000 })
  await dialog.getByRole('button', { name: /Release other lock|Unlock and continue/ }).click()

  await expect(page.getByText('Completion: Set Task Status')).toBeVisible({ timeout: 20_000 })
  await expect
    .poll(async () => (await getTask(request, secondTask.id)).lockedBy)
    .toBe(mapper.user.id)
  expect((await getTask(request, task.id)).lockedBy).toBeNull()
})

test('another mapper is told who holds the lock and can only preview the task', async ({
  mapper,
  reviewerPage,
  request,
  task,
}) => {
  await startMapping(mapper.page, task.id)

  await reviewerPage.goto(`/tasks/${task.id}`)
  await reviewerPage.getByRole('button', { name: 'Map this task' }).click()
  const dialog = reviewerPage.getByRole('dialog', { name: 'Unable to Lock Task' })
  await expect(dialog).toContainText(`locked by user ${mapper.user.name}`, { timeout: 20_000 })

  await dialog.getByRole('button', { name: 'Preview Task' }).click()
  await expect(dialog).toBeHidden()
  await expect(reviewerPage.getByText('Completion: Set Task Status')).toHaveCount(0)
  expect((await getTask(request, task.id)).lockedBy).toBe(mapper.user.id)
})

test('the task panel shows the instructions, the feature properties and the activity', async ({
  mapper,
  request,
  extraTasks,
}) => {
  const { page } = mapper
  const [task] = extraTasks
  const comment = `Panel comment ${Date.now()}`
  await startMapping(page, task.id)

  await expect(page.getByRole('tabpanel', { name: 'Instructions' })).toContainText(
    'Fix this point.'
  )

  await page.getByRole('tab', { name: 'Features (1)' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('Extra feature 0')

  await page.getByRole('tab', { name: 'Comments (0)' }).click()
  await page.getByRole('textbox', { name: 'Add a comment...' }).fill(comment)
  await page.getByRole('button', { name: 'Send comment' }).click()
  await expect(page.getByText('Comment added')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('tab', { name: 'Comments (1)' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('tabpanel')).toContainText(comment)

  const comments = await getTaskComments(request, task.id)
  expect(comments.map((c) => c.comment)).toEqual([comment])
  expect((await getTask(request, task.id)).status).toBe(TASK_STATUS.created)
})
