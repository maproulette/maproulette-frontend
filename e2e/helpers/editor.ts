import type { APIRequestContext, BrowserContext, Page } from '@playwright/test'
import {
  createChallenge,
  createTask,
  TASK_POINT,
  type TaskFields,
  type TestChallenge,
  type TestTask,
} from '../fixtures'
import { test as base, expect } from './task'

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

export function createEditorChallenge(
  request: APIRequestContext,
  projectId: number,
  fields: Record<string, unknown> = {}
): Promise<TestChallenge> {
  return createChallenge(request, projectId, {
    checkinComment: CHECKIN_COMMENT,
    checkinSource: CHECKIN_SOURCE,
    ...fields,
  })
}

export function createEditorTask(
  request: APIRequestContext,
  challengeId: number,
  fields: TaskFields = {}
): Promise<TestTask> {
  return createTask(request, challengeId, { properties: TASK_PROPERTIES, priority: 0, ...fields })
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

async function stubExternalEditors(context: BrowserContext) {
  for (const host of EXTERNAL_HOSTS) {
    await context.route(host, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' })
    )
  }
}

async function recordJosmCommands(context: BrowserContext): Promise<URL[]> {
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

export const test = base.extend<{ editorTask: EditorTask; josmCommands: URL[] }>({
  mapper: async ({ mapper }, use) => {
    await stubExternalEditors(mapper.page.context())
    await use(mapper)
  },

  josmCommands: async ({ mapper }, use) => {
    await use(await recordJosmCommands(mapper.page.context()))
  },

  editorTask: async ({ request, project }, use) => {
    const challenge = await createEditorChallenge(request, project.id, {
      defaultBasemap: 4,
      defaultBasemapId: 'Bing Aerial',
    })
    const task = await createEditorTask(request, challenge.id)
    await use({ challenge, task })
  },
})

export { expect }
