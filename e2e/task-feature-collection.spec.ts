import type { APIRequestContext } from '@playwright/test'
import { BACKEND_URL, expect, SUPER_KEY, test } from './fixtures'

// A task built from a GeoJSON FeatureCollection holds several features at
// once. All of them belong to the one task: they are drawn together, listed
// individually, and any one of them can be singled out.

interface TestMap {
  project: (l: [number, number]) => { x: number; y: number }
  setCenter: (l: [number, number]) => void
}

const lineFeature = (coordinates: [number, number][], properties: Record<string, unknown>) => ({
  type: 'Feature',
  geometry: { type: 'LineString', coordinates },
  properties,
})

const createTaskWithGeometries = async (
  request: APIRequestContext,
  challengeId: number,
  features: unknown[]
): Promise<number> => {
  const response = await request.post(`${BACKEND_URL}/api/v2/task`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: {
      name: `fc-task-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      parent: challengeId,
      instruction: 'Check the route.',
      geometries: { type: 'FeatureCollection', features },
      priority: 0,
    },
  })
  expect(response.ok(), `task creation failed: ${response.status()}`).toBeTruthy()
  return ((await response.json()) as { id: number }).id
}

test('every feature of a FeatureCollection task is listed, and one can be singled out', async ({
  page,
  request,
  challenge,
}) => {
  test.setTimeout(90_000)

  const taskId = await createTaskWithGeometries(request, challenge.id, [
    lineFeature(
      [
        [-95.46, 37.6866],
        [-95.452, 37.6866],
      ],
      { name: 'West to east leg', highway: 'residential', id: 'way/1' }
    ),
    lineFeature(
      [
        [-95.452, 37.6886],
        [-95.46, 37.6886],
      ],
      { name: 'East to west leg', highway: 'service', id: 'way/2' }
    ),
    lineFeature(
      [
        [-95.456, 37.6846],
        [-95.454, 37.6856],
      ],
      { name: 'Diagonal leg', surface: 'gravel', id: 'way/3' }
    ),
  ])

  await page.goto(`/tasks/${taskId}`)
  await page.getByRole('button', { name: 'Map this task' }).click()
  await expect(page.getByRole('button', { name: 'Fixed', exact: true })).toBeVisible({
    timeout: 20_000,
  })

  // The direction indicators are drawn with map images, which only register
  // once the style has loaded.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const map = (window as unknown as { __e2eMap?: maplibregl.Map }).__e2eMap
          return map
            ? map.hasImage('direction-arrow') &&
                map.hasImage('direction-start') &&
                map.hasImage('direction-end')
            : false
        }),
      { timeout: 20_000 }
    )
    .toBe(true)

  // The tab counts the tasks being worked on — just this one, unbundled
  await expect(page.getByRole('tab', { name: 'Features (1)' })).toBeVisible({ timeout: 15_000 })

  // The Features tab lists the task (and its bundle mates) as dropdowns, and
  // every feature of the collection gets its own block inside — rather than
  // the task showing only the first feature's properties.
  await page.getByRole('tab', { name: 'Features' }).click()
  const taskDropdown = page.getByRole('button', { name: new RegExp(`Task #${taskId}`) })
  await expect(taskDropdown).toContainText('3 features', { timeout: 15_000 })

  const firstFeature = page.locator('[aria-label="West to east leg"]')
  await expect(firstFeature).toBeVisible()
  await expect(page.locator('[aria-label="East to west leg"]')).toBeVisible()
  await expect(page.locator('[aria-label="Diagonal leg"]')).toBeVisible()

  // A feature's properties stay collapsed until it is opened
  await expect(firstFeature).not.toContainText('way/1')
  await firstFeature.getByRole('button', { name: /West to east leg/ }).click()
  await expect(firstFeature).toContainText('way/1')

  // Focusing one feature hides the task's other geometry until it is cleared.
  await firstFeature.getByRole('button', { name: 'Show only this feature on the map' }).click()
  await expect(page.getByText('Showing one feature of this task')).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: 'Show all' }).click()
  await expect(page.getByText('Showing one feature of this task')).not.toBeVisible()

  // `s` is MapRoulette 3's animation key, reused to turn the direction
  // indicators off and back on.
  const startMarkersOnScreen = () =>
    page.evaluate(() => {
      const map = (window as unknown as { __e2eMap?: maplibregl.Map }).__e2eMap
      if (!map) return -1
      const layers = map
        .getStyle()
        .layers.filter((layer) => layer.id.endsWith('-start'))
        .map((layer) => layer.id)
      return layers.length === 0 ? 0 : map.queryRenderedFeatures({ layers }).length
    })

  await expect.poll(startMarkersOnScreen, { timeout: 10_000 }).toBeGreaterThan(0)
  await page.keyboard.press('s')
  await expect.poll(startMarkersOnScreen, { timeout: 10_000 }).toBe(0)
  await page.keyboard.press('s')
  await expect.poll(startMarkersOnScreen, { timeout: 10_000 }).toBeGreaterThan(0)
})

test('direction indicators are drawn for bundled tasks too', async ({
  page,
  request,
  challenge,
}) => {
  test.setTimeout(90_000)

  const primaryId = await createTaskWithGeometries(request, challenge.id, [
    lineFeature(
      [
        [-95.456, 37.6866],
        [-95.452, 37.6866],
      ],
      { name: 'primary leg' }
    ),
  ])
  await createTaskWithGeometries(request, challenge.id, [
    lineFeature(
      [
        [-95.452, 37.6876],
        [-95.456, 37.6876],
      ],
      { name: 'bundled leg' }
    ),
  ])
  const secondTaskCenter: [number, number] = [-95.454, 37.6876]

  await page.goto(`/tasks/${primaryId}`)
  await page.getByRole('button', { name: 'Map this task' }).click()
  await expect(page.getByRole('button', { name: 'Fixed', exact: true })).toBeVisible({
    timeout: 20_000,
  })

  await page.getByRole('button', { name: 'Work on multiple tasks' }).click()
  await page.getByRole('button', { name: 'Draw to add tasks' }).click()
  await expect(page.getByRole('button', { name: 'Drawing...' })).toBeVisible({ timeout: 10_000 })

  // Same approach as task-bundling.spec.ts: centre the second task's marker so
  // the lasso is drawn on exposed canvas rather than under a map control.
  const canvas = page.locator('canvas.maplibregl-canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Map canvas did not render')

  await page.evaluate((lngLat) => {
    const map = (window as unknown as { __e2eMap?: TestMap }).__e2eMap
    map?.setCenter(lngLat)
  }, secondTaskCenter)

  const centre = { x: box.width / 2, y: box.height / 2 }
  await expect
    .poll(
      async () => {
        const projected = await page.evaluate((lngLat) => {
          const map = (window as unknown as { __e2eMap?: TestMap }).__e2eMap
          return map ? map.project(lngLat) : null
        }, secondTaskCenter)
        if (!projected) return null
        return Math.hypot(projected.x - centre.x, projected.y - centre.y) < 2
      },
      { timeout: 10_000 }
    )
    .toBe(true)

  const markerX = box.x + centre.x
  const markerY = box.y + centre.y
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

  await expect(page.getByRole('button', { name: /Working on 2 tasks/ })).toBeVisible({
    timeout: 10_000,
  })

  // Every task in the bundle is listed in the Features tab, the bundled one
  // collapsed until its dropdown is opened. The tab counts them.
  await expect(page.getByRole('tab', { name: 'Features (2)' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('tab', { name: 'Features' }).click()
  await expect(page.getByText(/Bundled Tasks \(2\)/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: new RegExp(`Task #${primaryId}`) })).toContainText(
    'Primary'
  )
  await expect(page.locator('[aria-label="primary leg"]')).toBeVisible()

  const bundledDropdown = page
    .getByRole('button', { name: /Task #\d+/ })
    .filter({ hasNotText: 'Primary' })
    .first()
  await expect(page.locator('[aria-label="bundled leg"]')).not.toBeVisible()
  await bundledDropdown.click()
  await expect(page.locator('[aria-label="bundled leg"]')).toBeVisible({ timeout: 10_000 })

  // The bundle is navigated from here now, not from a list on the Instructions
  // tab: each bundled task carries its own "open" action.
  await expect(page.locator('button[aria-label^="Open Task"]')).toHaveCount(1)
  await page.getByRole('tab', { name: 'Instructions' }).click()
  await expect(page.getByText(/Bundled Tasks/i)).toHaveCount(0)
  await page.getByRole('tab', { name: 'Features' }).click()

  // Both tasks' geometry is drawn from the one source the direction layers
  // read, so the bundled task's line carries indicators as well — MapRoulette
  // 3's animation never ran at all once tasks were bundled.
  const endpointCount = await page.evaluate(() => {
    const map = (window as unknown as { __e2eMap?: maplibregl.Map }).__e2eMap
    if (!map) return 0
    return map
      .getStyle()
      .layers.filter((layer) => layer.id.endsWith('-start') || layer.id.endsWith('-end')).length
  })
  expect(endpointCount).toBe(2)

  // Both lines back in view, so what is on screen is the whole bundle
  await page.evaluate(() => {
    const map = (window as unknown as { __e2eMap?: maplibregl.Map }).__e2eMap
    map?.fitBounds(
      [
        [-95.458, 37.685],
        [-95.45, 37.689],
      ],
      { padding: 60, duration: 0 }
    )
  })

  // One start marker per task in the bundle
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const map = (window as unknown as { __e2eMap?: maplibregl.Map }).__e2eMap
          if (!map) return 0
          const layers = map
            .getStyle()
            .layers.filter((layer) => layer.id.endsWith('-start'))
            .map((layer) => layer.id)
          return map.queryRenderedFeatures({ layers }).length
        }),
      { timeout: 15_000 }
    )
    .toBe(2)
})
