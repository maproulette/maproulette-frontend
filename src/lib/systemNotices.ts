import type { UserProperties } from '@/types/User'

/**
 * A system notice — e.g. warning of upcoming maintenance — served by the
 * backend from an externally hosted JSON file. See the docs' System-Notice
 * Management page.
 */
export interface SystemNotice {
  /** Stable id for the notice, used to remember that a user dismissed it. */
  uuid: string
  /** Notice body. May contain Markdown. */
  message: string
  /** ISO 8601 timestamp (UTC) after which the notice stops being shown. */
  expirationTimestamp: string
}

/**
 * App id the acknowledgement list is filed under in the user's `properties`.
 * The backend namespaces properties per client application, each holding a
 * `meta` block and a `settings` block.
 */
const APP_ID = 'maproulette'
const ACKNOWLEDGED_SETTING = 'acknowledgedNotices'

const isNotice = (value: unknown): value is SystemNotice => {
  const notice = value as SystemNotice
  return (
    !!notice &&
    typeof notice.uuid === 'string' &&
    typeof notice.message === 'string' &&
    typeof notice.expirationTimestamp === 'string'
  )
}

/**
 * Pull the notices array out of an announcements response. The backend wraps
 * the hosted file's contents in a `message` envelope, but returns the bare
 * document in some deployments, so both shapes are accepted. Anything else —
 * including the empty response a server admin gets by removing the file —
 * yields no notices rather than an error.
 */
export const parseSystemNotices = (response: unknown): SystemNotice[] => {
  const body = response as { notices?: unknown; message?: { notices?: unknown } }
  const notices = body?.message?.notices ?? body?.notices
  return Array.isArray(notices) ? notices.filter(isNotice) : []
}

/** Notices that have not passed their expiration timestamp. */
export const activeNotices = (notices: SystemNotice[], now: Date = new Date()): SystemNotice[] =>
  notices.filter((notice) => {
    const expires = Date.parse(notice.expirationTimestamp)
    return Number.isFinite(expires) && expires > now.getTime()
  })

/** Notice uuids this user has already dismissed. */
export const acknowledgedNoticeIds = (properties: UserProperties | null | undefined): string[] => {
  const settings = (properties?.[APP_ID] as { settings?: Record<string, unknown> } | undefined)
    ?.settings
  const acknowledged = settings?.[ACKNOWLEDGED_SETTING]
  return Array.isArray(acknowledged) ? acknowledged.filter((id) => typeof id === 'string') : []
}

/**
 * The user's `properties` with `uuid` added to the acknowledged list, ready to
 * send back to the backend. Other applications' properties are preserved, and
 * the revision stamp is refreshed the way MapRoulette's other clients do it.
 */
export const withAcknowledgedNotice = (
  properties: UserProperties | null | undefined,
  uuid: string,
  now: Date = new Date()
): UserProperties => {
  const existing = (properties?.[APP_ID] ?? {}) as {
    meta?: Record<string, unknown>
    settings?: Record<string, unknown>
  }
  const acknowledged = acknowledgedNoticeIds(properties)
  return {
    ...properties,
    [APP_ID]: {
      ...existing,
      meta: { ...existing.meta, revision: now.getTime() },
      settings: {
        ...existing.settings,
        [ACKNOWLEDGED_SETTING]: acknowledged.includes(uuid)
          ? acknowledged
          : [...acknowledged, uuid],
      },
    },
  }
}
