import { expect, test } from './fixtures'

test('a user can lasso-bundle a second task and clear the bundle', async ({
  page,
  task,
  secondTask,
}) => {
  test.setTimeout(60_000)

  await page.goto(`/tasks/${task.id}`)

  await expect(page.getByText(`Task #${task.id}`).first()).toBeVisible({ timeout: 15_000 })

  // Opening a task URL directly no longer auto-claims it (only in-app
  // navigation with claimTask=true does); clicking "Map this task" locks it,
  // at which point the completion action buttons replace that prompt.
  await page.getByRole('button', { name: 'Map this task' }).click()
  await expect(page.getByRole('button', { name: 'Fixed', exact: true })).toBeVisible({
    timeout: 20_000,
  })

  const multiTaskTrigger = page.getByRole('button', { name: 'Work on multiple tasks' })
  await expect(multiTaskTrigger).toBeVisible({ timeout: 15_000 })
  await multiTaskTrigger.click()

  const drawButton = page.getByRole('button', { name: 'Draw to add tasks' })
  await expect(drawButton).toBeVisible({ timeout: 10_000 })
  await drawButton.click()
  await expect(page.getByRole('button', { name: 'Drawing...' })).toBeVisible({ timeout: 5_000 })

  // Rather than guess a lasso path that might land on overlay UI (the
  // MultiTaskPanel, legend, scale bar, etc. all sit on top of the map canvas
  // at various corners) or miss `secondTask`'s marker (whose on-screen
  // position depends on the map's auto-fit bounds/zoom), project its known
  // lng/lat to exact screen coordinates via the map instance TaskMap.tsx
  // exposes in this test mode, and draw a small lasso directly around it.
  const canvas = page.locator('canvas.maplibregl-canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Map canvas did not render')
  const projected = await page.evaluate((lngLat) => {
    const map = (
      window as unknown as {
        __e2eMap?: { project: (l: [number, number]) => { x: number; y: number } }
      }
    ).__e2eMap
    if (!map) throw new Error('__e2eMap was not exposed by TaskMap')
    return map.project(lngLat)
  }, secondTask.coordinates)

  const markerX = box.x + projected.x
  const markerY = box.y + projected.y
  const r = 20
  const corners: [number, number][] = [
    [markerX - r, markerY - r],
    [markerX + r, markerY - r],
    [markerX + r, markerY + r],
    [markerX - r, markerY + r],
    [markerX - r, markerY - r],
  ]

  await page.mouse.move(corners[0][0], corners[0][1])
  await page.mouse.down()
  for (const [x, y] of corners.slice(1)) {
    await page.mouse.move(x, y, { steps: 8 })
  }
  await page.mouse.up()

  // The lasso selection is synced into an active bundle containing both tasks.
  const bundleTrigger = page.getByRole('button', { name: /Working on 2 tasks/ })
  await expect(bundleTrigger).toBeVisible({ timeout: 10_000 })

  // Clear the bundle via the "Delete" keyboard shortcut, confirmed through
  // ClearBundleDialog, and verify the panel reverts to its unbundled state.
  await page.keyboard.press('Delete')
  await expect(page.getByRole('heading', { name: 'Clear Task Bundle?' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Clear Bundle' }).click()

  await expect(page.getByRole('button', { name: 'Work on multiple tasks' })).toBeVisible({
    timeout: 10_000,
  })
  await expect(bundleTrigger).not.toBeVisible()

  // Clean up: mark the primary task Fixed so this run leaves both tasks in a
  // terminal state, matching task-workflow.spec.ts's convention.
  await page.getByRole('button', { name: 'Fixed', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Complete Task Action' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Complete & Continue' }).click()
  await expect(page.getByText('Task marked as Fixed')).toBeVisible({ timeout: 15_000 })
})
