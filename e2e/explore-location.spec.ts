import { expect, test } from './fixtures'

/**
 * Picking a location has to move the camera. This is an e2e rather than a unit
 * test because the bug it guards was pure wiring: `requestFitBounds` set state
 * in the search context that no component consumed, while the map inferred the
 * fit from the outline appearing and skipped it whenever `window.location.hash`
 * was non-empty -- which it always is, because the map writes its own camera
 * there. Every layer passed its own tests; the camera still never moved.
 */

const SALT_LAKE = {
  place_id: 1,
  osm_type: 'relation',
  osm_id: 126461,
  display_name: 'Salt Lake City, Salt Lake County, Utah, United States',
  // minLat, maxLat, minLon, maxLon -- Nominatim's order
  boundingbox: ['40.6996', '40.8532', '-112.1013', '-111.7395'],
  geojson: {
    type: 'Polygon',
    coordinates: [
      [
        [-112.1013, 40.6996],
        [-111.7395, 40.6996],
        [-111.7395, 40.8532],
        [-112.1013, 40.8532],
        [-112.1013, 40.6996],
      ],
    ],
  },
}

test('picking a location moves the map to it', async ({ page }) => {
  let searchRequests = 0
  await page.route('**nominatim.openstreetmap.org/search**', (route) => {
    searchRequests++
    return route.fulfill({ json: [SALT_LAKE] })
  })
  await page.route('**nominatim.openstreetmap.org/lookup**', (route) =>
    route.fulfill({ json: [SALT_LAKE] })
  )

  await page.goto('/')

  // The camera lands in the URL hash as #<zoom>/<lat>/<lng>, which is how we can
  // read it back -- and is exactly why the old `hash.length > 1` guard could
  // never pass: the hash is already populated at load.
  const camera = () => {
    const match = /#(-?[\d.]+)\/(-?[\d.]+)\/(-?[\d.]+)/.exec(page.url())
    if (!match) return null
    const [, zoom, lat, lng] = match
    return { zoom: Number(zoom), lat: Number(lat), lng: Number(lng) }
  }

  await expect.poll(camera, { timeout: 30_000 }).not.toBeNull()
  const worldView = camera()
  expect(worldView?.zoom).toBeLessThan(6)

  const locationInput = page.getByPlaceholder(/search location/i)
  await locationInput.click()
  await locationInput.pressSequentially('Salt Lake City')
  await page.waitForTimeout(1500)
  expect(searchRequests).toBe(0)
  await locationInput.press('Enter')

  // Suggestions are `role="option"` buttons that split the display name into a
  // primary line and a muted remainder, so match the option, not the full name.
  await page.getByRole('option').filter({ hasText: 'Salt Lake City' }).first().click()
  expect(searchRequests).toBe(1)

  // Fitting a city-sized box: zoomed well in, centred on the place.
  await expect.poll(() => camera()?.zoom ?? 0, { timeout: 20_000 }).toBeGreaterThan(8)

  const fitted = camera()
  if (!fitted) throw new Error(`camera never landed in the hash (url: ${page.url()})`)
  expect(fitted.lat).toBeCloseTo(40.78, 0)
  expect(fitted.lng).toBeCloseTo(-111.92, 0)

  // The outline's label names the place it belongs to.
  const indicator = page.getByTitle(/Recenter on the outlined area: Salt Lake City/i)
  await expect(indicator).toBeVisible()

  // Move the camera far away, then use the label to come back. Driving this
  // through the hash rather than a synthetic drag: the map listens to
  // hashchange (that is what `hash` on MapGL wires up), so this is a real
  // camera move without depending on drag-gesture timing.
  await page.evaluate(() => {
    window.location.hash = '#3/20/20'
  })

  await expect
    .poll(() => Math.abs((camera()?.lng ?? 0) - fitted.lng), { timeout: 10_000 })
    .toBeGreaterThan(1)

  await indicator.click()

  await expect
    .poll(() => Math.abs((camera()?.lng ?? 0) - fitted.lng), { timeout: 15_000 })
    .toBeLessThan(0.02)
  expect(camera()?.lat).toBeCloseTo(fitted.lat, 1)
})
