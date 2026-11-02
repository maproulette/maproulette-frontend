import { readFileSync } from 'node:fs'
import type { APIRequestContext, Page } from '@playwright/test'
import type { Project } from '@/types/Project'
import type { UserWhoamiResponse } from '@/types/User'
import { BACKEND_URL, newSessionRequest, storedProjectId, type TestUser } from './fixtures'
import { expect, test } from './helpers/misc'

type Locale = 'en-US' | 'de' | 'es' | 'fr' | 'ja' | 'pt-BR'

const LANGUAGE_NAMES: Record<Locale, string> = {
  'en-US': 'English (U.S.)',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  'pt-BR': 'Português Brasileiro',
}

const catalogs = new Map<Locale, Record<string, string>>()
const catalog = (locale: Locale) => {
  if (!catalogs.has(locale)) {
    catalogs.set(
      locale,
      JSON.parse(
        readFileSync(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8')
      ) as Record<string, string>
    )
  }
  return catalogs.get(locale) ?? {}
}

const message = (locale: Locale, id: string) => (catalog(locale)[id] ?? catalog('en-US')[id]).trim()

const pluralBranch = (locale: Locale, id: string, branch: string, count: number) => {
  const match = message(locale, id).match(new RegExp(`${branch} \\{([^}]*)\\}`))
  if (!match) throw new Error(`${locale} has no "${branch}" branch for ${id}`)
  return match[1].replace('#', new Intl.NumberFormat(locale).format(count)).trim()
}

const storedLocale = async (request: APIRequestContext) => {
  const response = await request.get(`${BACKEND_URL}/api/v2/user/whoami`)
  expect(response.ok()).toBe(true)
  return ((await response.json()) as UserWhoamiResponse).settings.locale
}

const saveLocaleThroughApi = async (request: APIRequestContext, user: TestUser, locale: Locale) => {
  const response = await request.put(`${BACKEND_URL}/api/v2/user/${user.id}`, {
    data: { locale },
  })
  expect(response.ok(), await response.text()).toBe(true)
}

async function chooseLanguage(page: Page, current: Locale, next: Locale) {
  await page.goto('/settings')
  await page.getByRole('combobox', { name: 'Language' }).click({ timeout: 20_000 })
  await page.getByRole('option', { name: LANGUAGE_NAMES[next], exact: true }).click()
  await page.getByRole('button', { name: message(current, 'settings.submit.saveChanges') }).click()
}

test.describe.configure({ timeout: 120_000 })

test('each language translates the interface, falls back to English where untranslated and survives a reload', async ({
  playwright,
  member,
  memberPage: page,
}) => {
  const memberRequest = await newSessionRequest(playwright.request, member)
  let current: Locale = 'en-US'

  for (const locale of ['de', 'es', 'fr', 'ja', 'pt-BR'] as const) {
    await chooseLanguage(page, current, locale)
    await expect.poll(() => storedLocale(memberRequest)).toBe(locale)
    current = locale

    await page.reload()
    const nav = page.getByRole('navigation', { name: message(locale, 'common.primary') })
    await expect(
      nav.getByRole('link', { name: message(locale, 'appLayout.header.nav.dashboard') })
    ).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByRole('tab', { name: message(locale, 'settings.general.title') })
    ).toBeVisible()
    expect(catalog(locale)['settings.general.languageLabel']).toBeUndefined()
    await expect(page.getByRole('combobox', { name: 'Language' })).toHaveText(
      LANGUAGE_NAMES[locale]
    )
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
  }

  await chooseLanguage(page, current, 'en-US')
  await expect.poll(() => storedLocale(memberRequest)).toBe('en-US')
  await page.reload()
  await expect(
    page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' })
  ).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('tab', { name: 'General' })).toBeVisible()
  await memberRequest.dispose()
})

test('counted words take the plural form each language uses for one and for several', async ({
  playwright,
  request,
  member,
  memberPage: page,
}) => {
  const token = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 10)}`
  const solo = token('Solo')
  const pair = token('Pair')
  const created: number[] = []
  for (const name of [solo, `${pair}a`, `${pair}b`]) {
    const response = await request.post(`${BACKEND_URL}/api/v2/project`, {
      data: {
        name,
        displayName: name,
        description: 'Localization test project',
        enabled: true,
      },
    })
    expect(response.ok()).toBe(true)
    created.push(storedProjectId((await response.json()) as Project))
  }
  const memberRequest = await newSessionRequest(playwright.request, member)
  const id = 'appLayout.header.globalSearch.findProject.resultCount'

  try {
    for (const locale of ['de', 'es', 'en-US'] as const) {
      await saveLocaleThroughApi(memberRequest, member, locale)
      await page.goto('/')
      const search = page.getByRole('searchbox')
      for (const [query, count] of [
        [`p: ${solo}`, 1],
        [`p: ${pair}`, 2],
      ] as const) {
        await search.click({ timeout: 20_000 })
        await search.fill(query)
        await expect(page.getByRole('listbox')).toContainText(
          pluralBranch(locale, id, count === 1 ? 'one' : 'other', count),
          { timeout: 15_000 }
        )
      }
    }
  } finally {
    await memberRequest.dispose()
    for (const projectId of created) {
      await request.delete(`${BACKEND_URL}/api/v2/project/${projectId}?immediate=true`)
    }
  }
})

test('dates and decimal numbers follow the chosen language', async ({
  playwright,
  request,
  project,
  member,
  memberPage: page,
}) => {
  const stored = await request.get(`${BACKEND_URL}/api/v2/project/${project.id}`)
  const { created: createdAt } = (await stored.json()) as Project
  if (createdAt === undefined) throw new Error(`Project ${project.id} has no created date`)
  const created = new Date(createdAt)
  const memberRequest = await newSessionRequest(playwright.request, member)
  const upload = Buffer.from('x'.repeat(1_587))

  for (const locale of ['de', 'fr', 'ja', 'pt-BR', 'en-US'] as const) {
    await saveLocaleThroughApi(memberRequest, member, locale)

    await page.goto(`/project/${project.id}`)
    await expect(
      page
        .getByText(new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(created), {
          exact: true,
        })
        .first()
    ).toBeVisible({ timeout: 20_000 })

    await page.goto(`/manage/challenge/new?projectId=${project.id}`)
    await page
      .getByRole('radio', { name: /GeoJSON/ })
      .first()
      .check({ timeout: 20_000 })
    await page.locator('input[type="file"]').setInputFiles({
      name: 'size.geojson',
      mimeType: 'application/geo+json',
      buffer: upload,
    })
    const kilobytes = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(upload.length / 1024)
    await expect(page.getByText(`(${kilobytes} KB)`, { exact: false })).toBeVisible()
  }
  await memberRequest.dispose()
})
