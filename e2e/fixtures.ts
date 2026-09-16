import { execFileSync } from 'node:child_process'
import { type APIRequestContext, test as base, type Page } from '@playwright/test'

// Where the test stack's backend is listening. Overridable so the stack can sit
// beside a local development backend on 9000 rather than fighting it for the
// port — set E2E_BACKEND_URL to match .env.test.local's VITE_API_BASE_URL, so
// the browser and these fixtures talk to the same server.
export const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:9000'
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

export interface TestTeam {
  id: number
  name: string
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

// Teams are their own top-level resource (not owned by a project), so unlike
// challenges and tasks they don't get cleaned up by a cascading project
// delete and need their own teardown below.
async function createTeam(request: APIRequestContext, name: string): Promise<TestTeam> {
  const response = await request.post(`${BACKEND_URL}/api/v2/team`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    // `id` and `groupType` are required by the backend's Group writer even on
    // a create, and the frontend sends the same two placeholders (see
    // api.team.useCreateTeam).
    data: { id: 0, groupType: 0, name, description: 'E2E test team' },
  })
  if (!response.ok()) {
    throw new Error(`Failed to create team: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as { id: number }
  return { id: body.id, name }
}

async function deleteTeam(request: APIRequestContext, id: number): Promise<void> {
  try {
    const response = await request.delete(`${BACKEND_URL}/api/v2/team/${id}`, {
      headers: { apiKey: SUPER_KEY },
    })
    if (!response.ok()) {
      console.warn(`Team ${id} teardown returned ${response.status()}: ${await response.text()}`)
    }
  } catch (error) {
    console.warn(`Team ${id} teardown threw:`, error)
  }
}

/**
 * Grants a team a role on a project, which is what the team detail page's
 * Projects section lists. Mirrors the frontend's api.project.useSetTeamProjectRole.
 */
export async function grantTeamProjectRole(
  request: APIRequestContext,
  teamId: number,
  projectId: number,
  role = 1
): Promise<void> {
  const response = await request.post(
    `${BACKEND_URL}/api/v2/team/${teamId}/project/${projectId}/${role}`,
    { headers: { apiKey: SUPER_KEY } }
  )
  if (!response.ok()) {
    throw new Error(`Failed to add team to project: ${response.status()} ${await response.text()}`)
  }
}

/**
 * Hands a challenge to a team, which is what puts it in that team's Challenges
 * section and its image on the challenge's card.
 */
export async function giveChallengeToTeam(
  request: APIRequestContext,
  challengeId: number,
  teamId: number | null
): Promise<void> {
  const response = await request.put(`${BACKEND_URL}/api/v2/challenge/${challengeId}`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: { ownerTeamId: teamId },
  })
  if (!response.ok()) {
    throw new Error(`Failed to set challenge team: ${response.status()} ${await response.text()}`)
  }
}

export interface TestUser {
  id: number
  name: string
  osmId: number
}

/**
 * A seeded user's own API key, in the "<userId>|<rawKey>" form the backend
 * expects from anyone who is not using the super key.
 *
 * Minting it takes two calls, and only the second is useful: PUT .../apikey
 * stores an encrypted key and hands back the encrypted value, which is not
 * what a client sends. Reading the user back as the super user returns it
 * decrypted and prefixed with the id, which is the usable form.
 *
 * This is what makes a second *acting* identity possible -- a real person who
 * is not a superuser, so tests can cover what someone without elevated rights
 * may do, and what they are refused.
 */
export async function mintApiKey(request: APIRequestContext, userId: number): Promise<string> {
  const minted = await request.put(`${BACKEND_URL}/api/v2/user/${userId}/apikey`, {
    headers: { apiKey: SUPER_KEY },
  })
  if (!minted.ok()) {
    throw new Error(`Could not mint an API key: ${minted.status()} ${await minted.text()}`)
  }

  const reread = await request.get(`${BACKEND_URL}/api/v2/user/${userId}`, {
    headers: { apiKey: SUPER_KEY },
  })
  if (!reread.ok()) {
    throw new Error(`Could not read the user back: ${reread.status()} ${await reread.text()}`)
  }

  const body = (await reread.json()) as { apiKey?: string }
  if (!body.apiKey?.includes('|')) {
    throw new Error(`User ${userId} came back without a usable API key: ${body.apiKey}`)
  }
  return body.apiKey
}

/**
 * Runs SQL against the test stack's database.
 *
 * The backend has no endpoint that creates a user -- real ones only ever
 * arrive through the OSM OAuth callback -- so a test needing a second person
 * to act on has to put one in the database itself. This reaches into the
 * compose stack to do it, which is why it is confined to this file.
 */
function runSql(sql: string): string {
  const compose = process.env.MR_COMPOSE_COMMAND ?? 'docker'
  return execFileSync(
    compose,
    [
      'compose',
      '-f',
      'docker-compose.test.yaml',
      'exec',
      '-T',
      'db',
      'psql',
      '-U',
      'maproulette',
      '-d',
      'maproulette',
      '-t',
      '-A',
      '-c',
      sql,
    ],
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim()
}

/**
 * A real user row, for tests that need somebody other than the super user to
 * grant something to. They are only ever a target here, never an actor: this
 * harness cannot authenticate as them (that needs an API key, see REVIEWER_KEY
 * above).
 */
export function seedUser(name: string, osmId: number): TestUser {
  const output = runSql(
    `INSERT INTO users (osm_id, osm_created, name, oauth_token, oauth_secret)
     VALUES (${osmId}, now(), '${name}', '', '') RETURNING id;`
  )
  // psql prints the returned row and then its own "INSERT 0 1" status line.
  const id = Number(output.split('\n')[0]?.trim())
  if (!Number.isInteger(id)) {
    // Throwing matters: a NaN id makes every later assertion vacuously pass.
    throw new Error(`Could not seed a user -- psql returned: ${JSON.stringify(output)}`)
  }
  return { id, name, osmId }
}

export function deleteSeededUser(user: TestUser): void {
  try {
    runSql(`DELETE FROM users WHERE id = ${user.id};`)
  } catch (error) {
    console.warn(`Seeded user ${user.id} teardown threw:`, error)
  }
}

/**
 * A tag-fix task modelled on a real cooperative challenge: a bakery in Salt
 * Lake City that MapRoulette proposes adding `diet:vegetarian=yes` to.
 *
 * Real tag-fix challenges are uploaded as line-by-line GeoJSON, where each
 * line is a FeatureCollection carrying `cooperativeWork` alongside its
 * `features`, and the feature's own properties hold the element's tags with an
 * `@id` naming it. Tasks here are created through the task endpoint instead
 * (the upload path imports asynchronously and is not reliable to wait on), so
 * the same two halves are passed separately -- but the shape of each is what a
 * real challenge ships.
 */
export const TAG_FIX_ELEMENT_ID = 'node/2344998584'

export const TAG_FIX_PROPERTIES = {
  amenity: 'cafe',
  'diet:vegetarian': 'yes',
  name: "Carlucci's",
  shop: 'bakery',
  wheelchair: 'yes',
  '@id': TAG_FIX_ELEMENT_ID,
}

/** The tag changes a tag-fix task proposes for one OSM element. */
export function tagFixWork(
  elementId: string,
  setTags: Record<string, string>,
  unsetTags: string[] = []
) {
  return {
    meta: { version: 2, type: 1 },
    operations: [
      {
        operationType: 'modifyElement',
        data: {
          id: elementId,
          operations: [
            { operation: 'setTags', data: setTags },
            ...(unsetTags.length > 0 ? [{ operation: 'unsetTags', data: unsetTags }] : []),
          ],
        },
      },
    ],
  }
}

async function createTagFixTask(
  request: APIRequestContext,
  challengeId: number,
  name: string
): Promise<TestTask> {
  const coordinates: [number, number] = [-111.9003158, 40.7630373]
  const response = await request.post(`${BACKEND_URL}/api/v2/task`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: {
      name,
      parent: challengeId,
      instruction: 'Confirm this bakery serves vegetarian food.',
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: TAG_FIX_PROPERTIES,
          },
        ],
      },
      priority: 0,
      cooperativeWork: tagFixWork(TAG_FIX_ELEMENT_ID, { 'diet:vegetarian': 'yes' }),
    },
  })
  if (!response.ok()) {
    throw new Error(`Failed to create tag-fix task: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as { id: number }
  return { id: body.id, name, challengeId, coordinates }
}

export interface TestActor {
  request: APIRequestContext
  user: TestUser
  apiKey: string
}

export const test = base.extend<{
  mapperRequest: TestActor
  project: TestProject
  challenge: TestChallenge
  task: TestTask
  secondTask: TestTask
  team: TestTeam
  seededUser: TestUser
  cooperativeChallenge: TestChallenge
  tagFixTask: TestTask
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

  team: async ({ request }, use) => {
    const team = await createTeam(request, uniqueName('e2e-team'))
    await use(team)
    await deleteTeam(request, team.id)
  },

  // A real second person to grant things to. OSM ids are namespaced well away
  // from anything the other fixtures use so parallel-ish runs cannot collide.
  seededUser: async ({ request: _request }, use) => {
    const user = seedUser(
      uniqueName('e2e-mapper').replace(/[^a-zA-Z0-9-]/g, ''),
      900_000_000 + Math.floor(Math.random() * 90_000_000)
    )
    await use(user)
    deleteSeededUser(user)
  },

  // A real person who is not a superuser, with their own API key, so a test can
  // act as someone with ordinary rights and see what they are refused.
  mapperRequest: async ({ playwright, request }, use) => {
    const user = seedUser(
      uniqueName('e2e-actor').replace(/[^a-zA-Z0-9-]/g, ''),
      910_000_000 + Math.floor(Math.random() * 80_000_000)
    )
    const key = await mintApiKey(request, user.id)
    const context = await playwright.request.newContext({
      baseURL: BACKEND_URL,
      extraHTTPHeaders: { apiKey: key, 'Content-Type': 'application/json' },
    })

    await use({ request: context, user, apiKey: key })

    await context.dispose()
    deleteSeededUser(user)
  },

  // A challenge becomes a tag-fix one by containing tag-fix work: the backend
  // sets its cooperative type when a task carrying cooperativeWork is created,
  // rather than taking it on the challenge itself. So the task comes first and
  // the challenge fixture is what waits on it.
  tagFixTask: async ({ request, project }, use) => {
    const challenge = await createChallenge(request, project.id, uniqueName('e2e-tagfix'))
    const task = await createTagFixTask(request, challenge.id, uniqueName('e2e-tagfix-task'))
    await use(task)
  },

  cooperativeChallenge: async ({ request, tagFixTask }, use) => {
    const response = await request.get(
      `${BACKEND_URL}/api/v2/challenge/${tagFixTask.challengeId}`,
      {
        headers: { apiKey: SUPER_KEY },
      }
    )
    const body = (await response.json()) as { id: number; name: string; parent: number }
    await use({ id: body.id, name: body.name, projectId: body.parent })
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
