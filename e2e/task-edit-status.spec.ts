import {
  completeTask,
  expect,
  getTask,
  getTaskComments,
  startMapping,
  TASK_STATUS,
  test,
} from './helpers/task'

test.describe.configure({ timeout: 60_000 })

test('marking a task Not an Issue stores it and leaves the task read-only', async ({
  mapper,
  request,
  task,
}) => {
  const comment = `Not an issue ${Date.now()}`
  await startMapping(mapper.page, task.id)

  await completeTask(mapper.page, 'Not an Issue', { comment, toast: 'Not an Issue' })

  expect((await getTask(request, task.id)).status).toBe(TASK_STATUS.falsePositive)
  const [stored] = await getTaskComments(request, task.id)
  expect(stored.comment).toBe(comment)
  expect(stored.actionId ?? null).toBeNull()

  await mapper.page.goto(`/tasks/${task.id}`)
  await expect(mapper.page.getByText('Want to map this challenge?')).toBeVisible({
    timeout: 20_000,
  })
  await expect(mapper.page.getByRole('button', { name: 'Map this task' })).toHaveCount(0)
})

test("a task marked Can't Complete stays open and can then be fixed", async ({
  mapper,
  request,
  task,
}) => {
  await startMapping(mapper.page, task.id)
  await completeTask(mapper.page, "Can't Complete", { toast: "Can't Complete" })
  expect((await getTask(request, task.id)).status).toBe(TASK_STATUS.tooHard)

  await startMapping(mapper.page, task.id)
  await completeTask(mapper.page, 'Fixed', { toast: 'Fixed' })
  expect((await getTask(request, task.id)).status).toBe(TASK_STATUS.fixed)

  await mapper.page.goto(`/tasks/${task.id}`)
  await expect(mapper.page.getByText('Want to map this challenge?')).toBeVisible({
    timeout: 20_000,
  })
  await expect(mapper.page.getByRole('button', { name: 'Fixed', exact: true })).toHaveCount(0)
})

test('the status chosen in the confirmation dialog is the one saved', async ({
  mapper,
  request,
  task,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)
  await page.getByRole('button', { name: 'Fixed', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Complete Task Action' })
  await dialog.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Already Fixed' }).click()
  await dialog.getByRole('button', { name: 'Complete & Continue' }).click()

  await expect(page.getByText('Task marked as Already Fixed')).toBeVisible({ timeout: 15_000 })
  expect((await getTask(request, task.id)).status).toBe(TASK_STATUS.alreadyFixed)
})

test('cancelling the confirmation dialog leaves the task untouched and still locked', async ({
  mapper,
  request,
  task,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)
  await page.getByRole('button', { name: 'Fixed', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Complete Task Action' })
  await dialog.getByLabel('Comment (Optional)').fill('never sent')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  const stored = await getTask(request, task.id)
  expect(stored.status).toBe(TASK_STATUS.created)
  expect(stored.lockedBy).toBe(mapper.user.id)
  expect(await getTaskComments(request, task.id)).toEqual([])
  await expect(page.getByRole('button', { name: 'Fixed', exact: true })).toBeEnabled()
})

test('status keys open the confirmation and Shift+Enter submits it', async ({
  mapper,
  request,
  task,
}) => {
  const { page } = mapper
  await startMapping(page, task.id)
  await page.getByText('Completion: Set Task Status').click()
  await page.keyboard.press('x')
  const dialog = page.getByRole('dialog', { name: 'Complete Task Action' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('combobox')).toHaveText('Already Fixed')
  await page.keyboard.type('typed in the comment box')
  await page.keyboard.press('Shift+Enter')

  await expect(page.getByText('Task marked as Already Fixed')).toBeVisible({ timeout: 15_000 })
  expect((await getTask(request, task.id)).status).toBe(TASK_STATUS.alreadyFixed)
  expect((await getTaskComments(request, task.id))[0]?.comment).toBe('typed in the comment box')
})
