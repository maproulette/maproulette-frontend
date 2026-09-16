import { BACKEND_URL, expect, SUPER_KEY, test } from './fixtures'

// Reporting a challenge, end to end: a mapper files one, a second mapper files
// their own, and a super admin triages them.
//
// This is the first spec to act as somebody who is *not* a superuser (see the
// mapperRequest fixture), which is what makes the interesting half testable --
// a report is attributed to whoever files it, and the triage queue is closed to
// everyone but super admins.

const REPORT_TEXT =
  'This challenge asks mappers to delete buildings that are plainly mapped correctly, ' +
  'and several changesets have already had to be reverted because of it. Please review ' +
  'the instructions before more damage is done to the area.'

test('a mapper can file a report, and it names them', async ({ challenge, mapperRequest }) => {
  const response = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: REPORT_TEXT } }
  )
  expect(response.status()).toBe(201)

  const report = (await response.json()) as {
    challengeId: number
    reporterId: number
    status: number
    statusName: string
  }
  expect(report.challengeId).toBe(challenge.id)
  expect(report.reporterId).toBe(mapperRequest.user.id)
  // A new report is open until an admin rules on it.
  expect(report.statusName).toBe('open')
})

test('a report is refused unless it explains the problem at some length', async ({
  challenge,
  mapperRequest,
}) => {
  const response = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: 'bad challenge' } }
  )

  // The bound exists so an admin has something to act on rather than a shrug.
  expect(response.status()).toBe(400)
  expect(await response.text()).toContain('100 characters')
})

test('the same mapper cannot pile a second open report onto one challenge', async ({
  challenge,
  mapperRequest,
}) => {
  const first = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: REPORT_TEXT } }
  )
  expect(first.status()).toBe(201)

  const second = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: REPORT_TEXT } }
  )
  expect(second.status()).toBe(400)
  expect(await second.text()).toContain('already have an open report')
})

test('the triage queue is closed to an ordinary mapper', async ({ mapperRequest }) => {
  const response = await mapperRequest.request.get(`${BACKEND_URL}/api/v2/challenge/reports`)

  // A report carries the reporter's identity and any email they volunteered,
  // so the queue is superusers only.
  expect(response.status()).toBe(403)
})

test('a mapper sees the reports on a challenge, without the admin side of them', async ({
  challenge,
  mapperRequest,
  request,
}) => {
  await mapperRequest.request.post(`${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`, {
    data: { comment: REPORT_TEXT, email: 'mapper@example.com' },
  })

  const response = await mapperRequest.request.get(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/reports`
  )
  expect(response.ok()).toBe(true)

  const reports = (await response.json()) as Array<{
    reporterName?: string | null
    reporterEmail?: string | null
    reviewComment?: string | null
    comment: string
  }>
  expect(reports).toHaveLength(1)
  // Filing also posts a public challenge comment naming the reporter, so the
  // name is public either way -- the address they left for follow-up is not.
  expect(reports[0].comment).toBe(REPORT_TEXT)
  expect(reports[0].reporterEmail ?? null).toBeNull()

  // The super admin does see it.
  const asAdmin = await request.get(`${BACKEND_URL}/api/v2/challenge/reports`, {
    headers: { apiKey: SUPER_KEY },
    params: { challengeId: challenge.id },
  })
  const adminView = (await asAdmin.json()) as Array<{ reporterEmail?: string | null }>
  expect(adminView[0]?.reporterEmail).toBe('mapper@example.com')
})

test('two different mappers can each report the same challenge', async ({
  challenge,
  mapperRequest,
  request,
  playwright,
}) => {
  await mapperRequest.request.post(`${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`, {
    data: { comment: REPORT_TEXT },
  })

  // A second real identity, built the same way the fixture builds the first.
  const { mintApiKey, seedUser, deleteSeededUser } = await import('./fixtures')
  const second = seedUser(`e2e-second-${Date.now()}`, 920_000_000 + Math.floor(Math.random() * 1e7))
  const secondKey = await mintApiKey(request, second.id)
  const secondContext = await playwright.request.newContext({
    extraHTTPHeaders: { apiKey: secondKey, 'Content-Type': 'application/json' },
  })

  try {
    const response = await secondContext.post(
      `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
      { data: { comment: REPORT_TEXT } }
    )
    // The one-open-report cap is per reporter, not per challenge.
    expect(response.status()).toBe(201)

    const all = await request.get(`${BACKEND_URL}/api/v2/challenge/reports`, {
      headers: { apiKey: SUPER_KEY },
      params: { challengeId: challenge.id },
    })
    const reports = (await all.json()) as Array<{ reporterId: number }>
    const reporters = reports.map((r) => r.reporterId)
    expect(reporters).toContain(mapperRequest.user.id)
    expect(reporters).toContain(second.id)
  } finally {
    await secondContext.dispose()
    deleteSeededUser(second)
  }
})

test('a super admin can action a report, and the reporter sees the outcome only', async ({
  challenge,
  mapperRequest,
  request,
}) => {
  const filed = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: REPORT_TEXT } }
  )
  const report = (await filed.json()) as { id: number }

  const decided = await request.put(`${BACKEND_URL}/api/v2/challenge/report/${report.id}/status`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: { status: 'actioned', reviewComment: 'archived the challenge' },
  })
  expect(decided.ok()).toBe(true)

  const asMapper = await mapperRequest.request.get(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/reports`
  )
  const seen = (await asMapper.json()) as Array<{
    statusName: string
    reviewedAt?: string | null
    reviewedByName?: string | null
    reviewComment?: string | null
  }>

  // The outcome and when it was reached are the reporter's business; who ruled
  // and the note they left for their own records are not.
  expect(seen[0].statusName).toBe('actioned')
  expect(seen[0].reviewedAt).toBeTruthy()
  expect(seen[0].reviewedByName ?? null).toBeNull()
  expect(seen[0].reviewComment ?? null).toBeNull()
})

test('resolving a report frees the reporter to raise the challenge again', async ({
  challenge,
  mapperRequest,
  request,
}) => {
  const filed = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: REPORT_TEXT } }
  )
  const report = (await filed.json()) as { id: number }

  await request.put(`${BACKEND_URL}/api/v2/challenge/report/${report.id}/status`, {
    headers: { apiKey: SUPER_KEY, 'Content-Type': 'application/json' },
    data: { status: 'dismissed' },
  })

  const again = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: REPORT_TEXT } }
  )
  expect(again.status()).toBe(201)
})

test('an ordinary mapper cannot rule on a report', async ({ challenge, mapperRequest }) => {
  const filed = await mapperRequest.request.post(
    `${BACKEND_URL}/api/v2/challenge/${challenge.id}/report`,
    { data: { comment: REPORT_TEXT } }
  )
  const report = (await filed.json()) as { id: number }

  // Not even on their own report.
  const response = await mapperRequest.request.put(
    `${BACKEND_URL}/api/v2/challenge/report/${report.id}/status`,
    { data: { status: 'dismissed' } }
  )
  expect(response.status()).toBe(403)
})
