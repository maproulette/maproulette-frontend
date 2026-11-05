import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { APIRequestContext, Page } from '@playwright/test'
import type { Task, TaskGetResponse } from '@/types/Task'
import { BACKEND_URL, test as base, expect } from '../fixtures'

export interface GeoJSONServer {
  serve: (path: string, body: string) => void
  backendUrl: (path: string) => string
  requests: (path: string) => number
}

const BACKEND_HOST = process.env.E2E_HOST_FROM_BACKEND ?? 'host.docker.internal'
const LISTEN_HOST = process.env.E2E_STUB_LISTEN_HOST ?? '127.0.0.1'
export const OVERPASS_STUB_PORT = Number(process.env.E2E_OVERPASS_STUB_PORT ?? 18555)

export const featureCollection = (
  features: { id: string; name: string; coordinates: [number, number]; extra?: object }[]
) =>
  JSON.stringify({
    type: 'FeatureCollection',
    features: features.map(({ id, name, coordinates, extra }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates },
      properties: { '@id': id, name, ...extra },
    })),
  })

export const lineByLine = (
  features: { id: string; name: string; coordinates: [number, number] }[]
) =>
  features
    .map(({ id, name, coordinates }) =>
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: { '@id': id, name },
          },
        ],
      })
    )
    .join('\n')

export async function challengeTasks(
  request: APIRequestContext,
  challengeId: number
): Promise<Task[]> {
  const response = await request.get(
    `${BACKEND_URL}/api/v2/challenge/${challengeId}/tasks?limit=100`
  )
  expect(response.ok()).toBe(true)
  return ((await response.json()) as Task[]).sort((a, b) => a.id - b.id)
}

export async function waitForTaskNames(
  request: APIRequestContext,
  challengeId: number,
  names: string[]
): Promise<Task[]> {
  let tasks: Task[] = []
  await expect
    .poll(
      async () => {
        tasks = await challengeTasks(request, challengeId)
        return tasks.map((task) => task.geometries.features[0]?.properties?.name).sort()
      },
      { timeout: 60_000, intervals: [1_000] }
    )
    .toEqual([...names].sort())
  return tasks
}

export async function startOverpassStub(
  port: number,
  springs: { id: string; name: string; coordinates: [number, number] }[] = [
    { id: 'node/101', name: 'North spring', coordinates: [-95.4541, 37.6861] },
    { id: 'node/102', name: 'East spring', coordinates: [-95.4532, 37.6872] },
    { id: 'node/103', name: 'South spring', coordinates: [-95.4553, 37.6853] },
  ]
) {
  const queries: string[] = []
  const body = JSON.stringify({
    version: 0.6,
    elements: springs.map(({ id, name, coordinates: [lon, lat] }) => ({
      type: 'node',
      id: Number(id.split('/')[1]),
      lat,
      lon,
      tags: { natural: 'spring', name },
    })),
  })
  const server = createServer((req, res) => {
    let received = ''
    req.on('data', (chunk) => {
      received += chunk
    })
    req.on('end', () => {
      queries.push(decodeURIComponent(`${req.url ?? ''} ${received}`.replace(/\+/g, ' ')))
      res.setHeader('Content-Type', 'application/json')
      res.end(body)
    })
  })
  await new Promise<void>((resolve) => server.listen(port, LISTEN_HOST, resolve))
  return {
    queries,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

export async function openCreateForm(page: Page, projectId: number) {
  await page.goto(`/manage/challenge/new?projectId=${projectId}`)
  await expect(page.getByRole('heading', { name: 'Create New Challenge' })).toBeVisible({
    timeout: 15_000,
  })
}

export async function fillBasics(page: Page, name: string) {
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Description').fill('Springs that need checking.')
  await page.getByLabel('Instructions').fill('Check that {{name}} is still flowing.')
  await page.getByLabel('Changeset comment').fill('Checked {{name}}')
  await page.getByLabel('Changeset source').fill('Survey')
  await page.getByRole('checkbox', { name: /automated edits code of conduct/i }).check()
}

export async function chooseUpload(page: Page, fileName: string, body: string) {
  await page.getByRole('radio', { name: /upload a geojson file/i }).check()
  await page.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'application/geo+json',
    buffer: Buffer.from(body),
  })
}

export async function submitAndReadId(page: Page): Promise<number> {
  await page.getByRole('button', { name: 'Create Challenge' }).click()
  await expect(page).toHaveURL(/\/manage\/challenge\/\d+$/, { timeout: 30_000 })
  return Number(new URL(page.url()).pathname.split('/').pop())
}

export async function setTaskStatus(
  request: APIRequestContext,
  taskId: number,
  status: number
): Promise<void> {
  const current = await request.get(`${BACKEND_URL}/api/v2/task/${taskId}`)
  expect(current.ok()).toBe(true)
  const task = (await current.json()) as TaskGetResponse
  const response = await request.put(`${BACKEND_URL}/api/v2/tasks`, {
    headers: { 'Content-Type': 'application/json' },
    data: [{ ...task, id: String(taskId), status }],
  })
  expect(response.ok(), await response.text()).toBe(true)
}

export const test = base.extend<{ geojsonServer: GeoJSONServer }>({
  geojsonServer: async ({ request: _request }, use) => {
    const bodies = new Map<string, string>()
    const hits = new Map<string, number>()
    const server: Server = createServer((req, res) => {
      const path = (req.url ?? '/').split('?')[0]
      hits.set(path, (hits.get(path) ?? 0) + 1)
      const body = bodies.get(path)
      res.setHeader('Access-Control-Allow-Origin', '*')
      if (body === undefined) {
        res.statusCode = 404
        res.end()
        return
      }
      res.setHeader('Content-Type', 'application/geo+json')
      res.end(body)
    })
    await new Promise<void>((resolve) => server.listen(0, LISTEN_HOST, resolve))
    const { port } = server.address() as AddressInfo
    const normalize = (path: string) => (path.startsWith('/') ? path : `/${path}`)

    await use({
      serve: (path, body) => {
        bodies.set(normalize(path), body)
      },
      backendUrl: (path) => `http://${BACKEND_HOST}:${port}${normalize(path)}`,
      requests: (path) => hits.get(normalize(path)) ?? 0,
    })

    await new Promise<void>((resolve) => server.close(() => resolve()))
  },
})

export { expect }
