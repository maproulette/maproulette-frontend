import type { APIRequestContext, BrowserContext, Page } from '@playwright/test'
import type { Challenge } from '@/types/Challenge'
import type { Task } from '@/types/Task'
import { BACKEND_URL, type TestChallenge, type TestTask } from '../fixtures'
import { test as base, expect } from './task'

export const TASK_POINT: [number, number] = [-95.454772, 37.6866588]
export const OSM_NODE_ID = 123456

const TASK_PROPERTIES = {
  name: 'Spring & Well',
  ref: '42',
  '@id': `node/${OSM_NODE_ID}`,
}

const CHECKIN_COMMENT = 'Checked {{name}} (ref {{ref}}) #maproulette'
export const CHECKIN_SOURCE = 'Bing; survey'

const EXTERNAL_HOSTS = [
  'https://www.openstreetmap.org/**',
  'https://rapideditor.org/**',
  'https://level0.osmz.ru/**',
  'https://cdn.jsdelivr.net/**',
]

const JOSM_HOST = 'http://127.0.0.1:8111/'

const ok = async (response: Awaited<ReturnType<APIRequestContext['get']>>, what: string) => {
  if (!response.ok()) {
    throw new Error(`${what} failed: ${response.status()} ${await response.text()}`)
  }
  return response
}

export async function createChallengeWith(
  request: APIRequestContext,
  projectId: number,
  fields: Record<string, unknown>
): Promise<TestChallenge> {
  const name = `e2e-editor-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  const response = await ok(
    await request.post(`${BACKEND_URL}/api/v2/challenge`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        parent: projectId,
        name,
        description: 'E2E editor challenge',
        instruction: 'Fix the identified issue.',
        difficulty: 2,
        checkinComment: CHECKIN_COMMENT,
        checkinSource: CHECKIN_SOURCE,
        enabled: true,
        featured: false,
        overpassQL: '',
        overpassTargetType: '',
        ...fields,
      },
    }),
    'Creating a challenge'
  )
  const body = (await response.json()) as Challenge
  return { id: body.id, name, projectId }
}

export async function createTaskWith(
  request: APIRequestContext,
  challengeId: number,
  {
    properties = TASK_PROPERTIES,
    instruction,
    coordinates = TASK_POINT,
  }: {
    properties?: Record<string, string>
    instruction?: string
    coordinates?: [number, number]
  } = {}
): Promise<TestTask> {
  const name = `e2e-editor-task-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  const response = await ok(
    await request.post(`${BACKEND_URL}/api/v2/task`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        name,
        parent: challengeId,
        ...(instruction === undefined ? {} : { instruction }),
        geometries: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates }, properties }],
        },
        priority: 0,
      },
    }),
    'Creating a task'
  )
  const body = (await response.json()) as Task
  return { id: body.id, name, challengeId, coordinates }
}

export interface RuntimeEnv {
  shortUrl: string | undefined
  idEditorUrl: string
  rapidEditorUrl: string
  level0EditorUrl: string
}

export async function runtimeEnv(page: Page): Promise<RuntimeEnv> {
  const env = (await (await page.request.get('/env.json')).json()) as Record<string, string>
  return {
    shortUrl: env.VITE_SHORT_URL || undefined,
    idEditorUrl: env.VITE_ID_EDITOR_SERVER_URL || 'https://www.openstreetmap.org/edit',
    rapidEditorUrl: env.VITE_RAPID_EDITOR_SERVER_URL || 'https://rapideditor.org/edit',
    level0EditorUrl: env.VITE_LEVEL0_EDITOR_SERVER_URL || 'https://level0.osmz.ru/index.php',
  }
}

export function expectedComment(env: RuntimeEnv, challengeId: number, taskId: number) {
  const link = env.shortUrl ? ` ${env.shortUrl}/c/${challengeId}/t/${taskId}` : ''
  return `Checked Spring & Well (ref 42) #maproulette${link} #maproulette-beta`
}

export async function stubExternalEditors(context: BrowserContext) {
  for (const host of EXTERNAL_HOSTS) {
    await context.route(host, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' })
    )
  }
}

export async function recordJosmCommands(context: BrowserContext): Promise<URL[]> {
  const commands: URL[] = []
  await context.route(`${JOSM_HOST}**`, (route) => {
    commands.push(new URL(route.request().url()))
    return route.fulfill({
      status: 200,
      contentType: 'text/plain',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'OK\r\n',
    })
  })
  return commands
}

export function hashParams(url: string): URLSearchParams {
  return new URLSearchParams(new URL(url).hash.slice(1))
}

export function expectNearTask(lat: number, lng: number) {
  expect(Math.abs(lat - TASK_POINT[1])).toBeLessThan(0.01)
  expect(Math.abs(lng - TASK_POINT[0])).toBeLessThan(0.01)
}

export interface EditorTask {
  challenge: TestChallenge
  task: TestTask
}

export const test = base.extend<{ editorTask: EditorTask }>({
  editorTask: async ({ request, project }, use) => {
    const challenge = await createChallengeWith(request, project.id, {
      defaultBasemap: 4,
      defaultBasemapId: 'Bing Aerial',
    })
    const task = await createTaskWith(request, challenge.id)
    await use({ challenge, task })
  },
})

export { expect }
