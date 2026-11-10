import { BACKEND_URL } from './fixtures'
import {
  completeTask,
  completeViaApi,
  dismissDialogs,
  expect,
  getChallengeActions,
  getTask,
  getTaskComments,
  getUserTaskMetrics,
  startMapping,
  storedTaskRows,
  TASK_STATUS,
  test,
} from './helpers/task'

const CHALLENGE_STATUS_FINISHED = 5

const TABLE_LABEL: Record<number, string> = {
  [TASK_STATUS.fixed]: 'Fixed',
  [TASK_STATUS.alreadyFixed]: 'Already Fixed',
  [TASK_STATUS.falsePositive]: 'Not an Issue',
  [TASK_STATUS.tooHard]: "Can't Complete",
}

const PLAN = [
  { button: 'Fixed', toast: 'Fixed', status: TASK_STATUS.fixed },
  { button: 'Already Fixed', toast: 'Already Fixed', status: TASK_STATUS.alreadyFixed },
  { button: 'Not an Issue', toast: 'Not an Issue', status: TASK_STATUS.falsePositive },
  { button: "Can't Complete", toast: "Can't Complete", status: TASK_STATUS.tooHard },
]

test('working through every task of a challenge records the results everywhere', async ({
  mapper,
  request,
  challenge,
  task,
  extraTasks,
}) => {
  test.setTimeout(180_000)
  const { page } = mapper
  const allIds = [task.id, ...extraTasks.map((t) => t.id)]
  const statusById = new Map<number, number>()

  await test.step('map every task in turn', async () => {
    await startMapping(page, task.id)
    for (const step of PLAN) {
      await expect(page.getByText('Completion: Set Task Status')).toBeVisible({ timeout: 20_000 })
      const currentId = Number(new URL(page.url()).pathname.split('/').pop())
      expect(allIds).toContain(currentId)
      expect(statusById.has(currentId)).toBe(false)
      await completeTask(page, step.button, {
        comment: `${step.button} via e2e`,
        toast: step.toast,
      })
      statusById.set(currentId, step.status)
      if (statusById.size < PLAN.length) {
        await expect(page).not.toHaveURL(new RegExp(`/tasks/${currentId}(\\b|$)`), {
          timeout: 20_000,
        })
      }
    }
    await expect(page.getByText('No more tasks available in this challenge')).toBeVisible({
      timeout: 20_000,
    })
    await expect(page).toHaveURL(new RegExp(`/challenge/${challenge.id}(#|$)`), {
      timeout: 20_000,
    })
  })

  await test.step('each task stores the status it was given and who mapped it', async () => {
    const ids = [...statusById.keys()]
    const stored = await Promise.all(ids.map((id) => getTask(request, id)))
    const rows = storedTaskRows(ids)
    for (const task of stored) {
      expect(task.status).toBe(statusById.get(task.id))
      expect(task.lockedBy).toBeNull()
      expect(rows.get(task.id)?.completedBy).toBe(mapper.user.id)
      expect(rows.get(task.id)?.mappedOn).not.toBeNull()
    }
  })

  await test.step('each task keeps the comment it was completed with', async () => {
    const entries = [...statusById]
    const comments = await Promise.all(entries.map(([id]) => getTaskComments(request, id)))
    entries.forEach(([, status], index) => {
      const step = PLAN.find((planned) => planned.status === status)
      expect(
        comments[index].map((comment) => ({
          text: comment.comment,
          actionId: comment.actionId ?? null,
        }))
      ).toEqual([{ text: `${step?.button} via e2e`, actionId: null }])
    })
  })

  await test.step('the challenge statistics count each status once', async () => {
    expect(await getChallengeActions(request, challenge.id)).toMatchObject({
      total: 4,
      available: 0,
      fixed: 1,
      alreadyFixed: 1,
      falsePositive: 1,
      tooHard: 1,
      skipped: 0,
    })
  })

  await test.step('the challenge page shows three of four tasks complete', async () => {
    await dismissDialogs(page)
    await page.goto(`/challenge/${challenge.id}`)
    await expect(page.getByText('75%').first()).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Details' }).click()
    const activity = page.getByRole('dialog', { name: 'Task Activity' })
    await expect(activity).toContainText('3 of 4 tasks')
    await expect(activity).toContainText('75%')
  })

  await test.step('the challenge is marked finished at 75% complete', async () => {
    const response = await request.get(`${BACKEND_URL}/api/v2/challenge/${challenge.id}`)
    expect(await response.json()).toMatchObject({
      status: CHALLENGE_STATUS_FINISHED,
      completionPercentage: 75,
      completionMetrics: { total: 4, fixed: 1, alreadyFixed: 1, falsePositive: 1, tooHard: 1 },
    })
  })

  await test.step('the mapper is credited with each completion', async () => {
    expect(await getUserTaskMetrics(request, mapper.user.id)).toMatchObject({
      fixed: 1,
      alreadyFixed: 1,
      falsePositive: 1,
      tooHard: 1,
    })
  })

  await test.step('the manage page statistics match', async () => {
    await page.goto(`/manage/challenge/${challenge.id}`)
    await page.getByRole('button', { name: 'Statistics' }).first().click()
    const stats = page.getByRole('dialog', { name: 'Statistics' })
    await expect(stats).toContainText('Task counts by status', { timeout: 20_000 })
    await expect(stats.getByRole('progressbar')).toHaveAccessibleName('75% complete')
    await expect(
      stats.getByText('Tasks remaining', { exact: true }).locator('xpath=..')
    ).toHaveText('Tasks remaining1 / 4')
    for (const [label, count] of [
      ['Available', 0],
      ['Fixed', 1],
      ['Not an Issue', 1],
      ['Skipped', 0],
      ['Already Fixed', 1],
      ["Can't Complete", 1],
      ['Total', 4],
    ] as const) {
      await expect(stats.getByText(label, { exact: true }).locator('xpath=..')).toContainText(
        String(count)
      )
    }
    await page.keyboard.press('Escape')
  })

  await test.step('the manage task table lists each task with its status', async () => {
    for (const [id, status] of statusById) {
      await expect(page.getByRole('row', { name: new RegExp(`Select task ${id} `) })).toContainText(
        TABLE_LABEL[status],
        { timeout: 20_000 }
      )
    }
  })
})

test('a finished challenge has nothing left to map', async ({
  mapper,
  request,
  challenge,
  task,
  secondTask,
}) => {
  await completeViaApi(mapper.request, task.id, TASK_STATUS.fixed)
  await completeViaApi(mapper.request, secondTask.id, TASK_STATUS.alreadyFixed)
  expect(await getChallengeActions(request, challenge.id)).toMatchObject({
    total: 2,
    available: 0,
  })

  const { page } = mapper
  await page.goto(`/challenge/${challenge.id}`)
  await expect(page.getByText('100%').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Browse Challenge' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start Challenge' })).toHaveCount(0)
})
