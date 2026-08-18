import { type APIRequestContext, test as base, type Page } from '@playwright/test'

export const BACKEND_URL = 'http://localhost:9000'
export const SUPER_KEY = 'super-secret-key'

// A second, distinct backend identity, for tests that need two separate
// users (e.g. a mapper who completes a task and a separate reviewer who
// accepts or rejects it) — a workflow with zero coverage today because
// every fixture above authenticates as the same single synthetic identity.
//
// SUPER_KEY can't just be duplicated with a different string: the backend
// maps *any* value configured as its `MR_SUPER_KEY` to the exact same
// singleton `User.superUser` object (see `getSessionByApiKey` in
// maproulette-backend's `SessionManager.scala`), so a second "super key"
// would still be the identical identity, not a second one. A genuine second
// identity has to be a real user's own per-user API key, in the
// "<userId>|<rawKey>" form the backend expects from anyone who isn't using
// the super key. This repo/harness has no OAuth-free way to create that
// user — real users are only ever created via the OSM OAuth callback flow
// (see `SessionManager.getUser`), which this harness doesn't perform — so
// provisioning one is a manual, one-time, out-of-band step:
//   1. Create a real user in the test backend's database (e.g. a one-time
//      real OSM OAuth login against the test backend, or a direct DB seed
//      by whoever administers the test environment).
//   2. As the super user (already available to this harness), call
//      `PUT /user/:userId/apikey` for that user's id to mint their API key.
//   3. Set the returned "<userId>|<rawKey>" value as `E2E_REVIEWER_API_KEY`
//      in the environment (or `.env.test`) before running specs that use
//      the `reviewerRequest` / `reviewerPage` fixtures below.
// Until that's done, those fixtures throw with this same explanation rather
// than silently running as the primary identity.
const REVIEWER_KEY = process.env.E2E_REVIEWER_API_KEY

function requireReviewerKey(): string {
  if (!REVIEWER_KEY) {
    throw new Error(
      'The reviewerRequest/reviewerPage fixture requires E2E_REVIEWER_API_KEY to be set to a ' +
        'real user\'s "<userId>|<rawKey>" API key. See the comment above REVIEWER_KEY in ' +
        'e2e/fixtures.ts for how to provision one.'
    )
  }
  return REVIEWER_KEY
}

const uniqueName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

export interface TestProject {
  id: number
  name: string
}

export interface TestChallenge {
  id: number
  name: string
  projectId: number
}

export interface TestTask {
  id: number
  name: string
  challengeId: number
  coordinates: [number, number]
}

async function createProject(request: APIRequestContext, name: string): Promise<TestProject> {
  const response = await request.post(`${BACKEND_URL}/api/v2/project`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: {
      name,
      displayName: name,
      description: 'E2E test project',
      enabled: true,
    },
  })
  if (!response.ok()) {
    throw new Error(`Failed to create project: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as { id: number }
  return { id: body.id, name }
}

async function deleteProject(request: APIRequestContext, id: number): Promise<void> {
  try {
    const response = await request.delete(`${BACKEND_URL}/api/v2/project/${id}?immediate=true`, {
      headers: { apiKey: SUPER_KEY },
    })
    if (!response.ok()) {
      console.warn(`Project ${id} teardown returned ${response.status()}: ${await response.text()}`)
    }
  } catch (error) {
    console.warn(`Project ${id} teardown threw:`, error)
  }
}

// Note: creating a challenge with `localGeoJSON`, or uploading tasks via the
// addFileTasks endpoint, does not reliably produce tasks against the pinned
// backend image (a server-side Scala collections bug silently fails async
// task import). Creating the challenge shell and its tasks directly via their
// own JSON-body endpoints (below) sidesteps that entirely and is immediate.
async function createChallenge(
  request: APIRequestContext,
  projectId: number,
  name: string
): Promise<TestChallenge> {
  const response = await request.post(`${BACKEND_URL}/api/v2/challenge`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: {
      parent: projectId,
      name,
      description: 'E2E test challenge',
      instruction: 'Fix the identified issue.',
      difficulty: 2,
      enabled: true,
      featured: false,
      overpassQL: '',
      overpassTargetType: '',
    },
  })
  if (!response.ok()) {
    throw new Error(`Failed to create challenge: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as { id: number }
  return { id: body.id, name, projectId }
}

async function createTask(
  request: APIRequestContext,
  challengeId: number,
  name: string,
  coordinates: [number, number] = [-95.454772, 37.6866588]
): Promise<TestTask> {
  const response = await request.post(`${BACKEND_URL}/api/v2/task`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: {
      name,
      parent: challengeId,
      instruction: 'Fix this point.',
      geometries: {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates }, properties: {} }],
      },
      priority: 0,
    },
  })
  if (!response.ok()) {
    throw new Error(`Failed to create task: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as { id: number }
  return { id: body.id, name, challengeId, coordinates }
}

export const test = base.extend<{
  project: TestProject
  challenge: TestChallenge
  task: TestTask
  secondTask: TestTask
  reviewerRequest: APIRequestContext
  reviewerPage: Page
}>({
  project: async ({ request }, use) => {
    const project = await createProject(request, uniqueName('e2e-project'))
    await use(project)
    await deleteProject(request, project.id)
  },

  // Deleting `project` (above) cascades to its challenges and tasks on the
  // backend, so neither fixture below needs its own teardown.
  challenge: async ({ request, project }, use) => {
    const challenge = await createChallenge(request, project.id, uniqueName('e2e-challenge'))
    await use(challenge)
  },

  task: async ({ request, challenge }, use) => {
    const task = await createTask(request, challenge.id, uniqueName('e2e-task'))
    await use(task)
  },

  // A second task in the same challenge, close enough to `task` that the map's
  // initial bounds-fit keeps both on screen at once (for tests that need more
  // than one task, e.g. bundling).
  secondTask: async ({ request, challenge }, use) => {
    const secondTask = await createTask(
      request,
      challenge.id,
      uniqueName('e2e-task-2'),
      [-95.452772, 37.6886588]
    )
    await use(secondTask)
  },

  // Direct-API second identity (see REVIEWER_KEY above). Behaves like the
  // built-in `request` fixture, except every call automatically carries the
  // reviewer's apiKey header instead of the caller having to pass one.
  reviewerRequest: async ({ playwright }, use) => {
    const reviewerKey = requireReviewerKey()
    const context = await playwright.request.newContext({
      baseURL: BACKEND_URL,
      extraHTTPHeaders: { apiKey: reviewerKey, 'Content-Type': 'application/json' },
    })
    await use(context)
    await context.dispose()
  },

  // Browser-driven second identity. The frontend reads its apiKey once per
  // page load from a single static /env.json served by the Vite dev server
  // (see vite.config.ts's `runtimeEnv` plugin and the boot script in
  // index.html) — that file is generated once from `.env.test` when the dev
  // server starts, so every `page` in a test run would otherwise fetch the
  // exact same apiKey, making a second *browser* identity structurally
  // impossible without a frontend change. This fixture works around that by
  // intercepting only this context's own /env.json request and swapping in
  // the reviewer's key, so pages from this fixture see a different apiKey
  // than pages from the default `page` fixture, without touching app code.
  reviewerPage: async ({ browser }, use) => {
    const reviewerKey = requireReviewerKey()
    const context = await browser.newContext()
    await context.route('**/env.json', async (route) => {
      const response = await route.fetch()
      const env = (await response.json()) as Record<string, unknown>
      await route.fulfill({ response, json: { ...env, VITE_SERVER_API_KEY: reviewerKey } })
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
