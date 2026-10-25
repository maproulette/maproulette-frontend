import {
  BACKEND_URL,
  compose,
  runSql,
  SUPER_USER_OSM_ID,
  SUPER_USER_TOKEN,
  sessionCookie,
} from './fixtures'

const BOOT_TIMEOUT_MS = 180_000

/**
 * Seeds the super user every test runs as by default, and makes sure the
 * backend treats them as one.
 *
 * The backend only promotes the accounts in MR_SUPER_ACCOUNTS when it boots,
 * and on a fresh stack this user does not exist yet at that point, so the
 * backend is restarted once after seeding them. A stack reused from an earlier
 * run already knows them and is left alone.
 */
export default async function globalSetup() {
  const output = runSql(
    `INSERT INTO users (osm_id, osm_created, name, oauth_token, oauth_secret)
     VALUES (${SUPER_USER_OSM_ID}, now(), 'e2e-super-user', '${SUPER_USER_TOKEN}', '')
     ON CONFLICT (osm_id) DO UPDATE SET oauth_token = EXCLUDED.oauth_token, modified = now()
     RETURNING id;`
  )
  const id = Number(output.split('\n')[0]?.trim())
  if (!Number.isInteger(id)) {
    throw new Error(`Could not seed the super user -- psql returned: ${JSON.stringify(output)}`)
  }
  process.env.E2E_SUPER_USER_ID = String(id)

  const user = { id, osmId: SUPER_USER_OSM_ID, token: SUPER_USER_TOKEN }
  if (await isSuperUser(user)) return

  compose(['restart', 'backend'])
  await waitForBackend()
  if (!(await isSuperUser(user))) {
    throw new Error(
      `The backend did not promote user ${id} (osm id ${SUPER_USER_OSM_ID}) to super user. ` +
        'Check that MR_SUPER_ACCOUNTS in docker-compose.test.yaml names that osm id.'
    )
  }
}

async function isSuperUser(user: { id: number; osmId: number; token: string }) {
  const response = await fetch(`${BACKEND_URL}/api/v2/superusers`, {
    headers: { Cookie: `PLAY_SESSION=${sessionCookie(user)}` },
  })
  if (!response.ok) return false
  return ((await response.json()) as number[]).includes(user.id)
}

async function waitForBackend() {
  const deadline = Date.now() + BOOT_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${BACKEND_URL}/api/v2/service/info`)).ok) return
    } catch {
      // Not accepting connections yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  throw new Error(`The backend did not come back within ${BOOT_TIMEOUT_MS / 1000}s of restarting`)
}
