import { describe, expect, it } from 'vitest'
import {
  acknowledgedNoticeIds,
  activeNotices,
  parseSystemNotices,
  type SystemNotice,
  withAcknowledgedNotice,
} from './systemNotices.ts'

const notice = (props: Partial<SystemNotice> = {}): SystemNotice => ({
  uuid: 'b98da355-a5e9-44b4-8a20-a5034d704de5',
  message: 'Maintenance is planned.',
  expirationTimestamp: '2999-08-01T17:00:00Z',
  ...props,
})

describe('parseSystemNotices', () => {
  it('reads notices out of the backend message envelope', () => {
    expect(parseSystemNotices({ message: { notices: [notice()] } })).toHaveLength(1)
  })

  it('also accepts the bare hosted document', () => {
    expect(parseSystemNotices({ notices: [notice()] })).toHaveLength(1)
  })

  it('returns nothing when no notices are configured', () => {
    for (const body of [undefined, null, {}, '', { notices: 'nope' }]) {
      expect(parseSystemNotices(body)).toEqual([])
    }
  })

  it('drops entries missing the fields a notice needs', () => {
    const body = { notices: [notice(), { message: 'no uuid' }, { uuid: 'x' }] }
    expect(parseSystemNotices(body)).toHaveLength(1)
  })
})

describe('activeNotices', () => {
  const now = new Date('2020-01-01T00:00:00Z')

  it('keeps notices that have not expired', () => {
    const future = notice({ expirationTimestamp: '2020-01-02T00:00:00Z' })
    expect(activeNotices([future], now)).toEqual([future])
  })

  it('drops expired notices', () => {
    const past = notice({ expirationTimestamp: '2019-12-31T00:00:00Z' })
    expect(activeNotices([past], now)).toEqual([])
  })

  it('drops notices with an unparseable timestamp rather than showing them forever', () => {
    expect(activeNotices([notice({ expirationTimestamp: 'soon' })], now)).toEqual([])
  })
})

describe('acknowledgedNoticeIds', () => {
  it('is empty for a user with no stored properties', () => {
    expect(acknowledgedNoticeIds(undefined)).toEqual([])
    expect(acknowledgedNoticeIds(null)).toEqual([])
    expect(acknowledgedNoticeIds({})).toEqual([])
  })

  it('reads the list filed under the app id', () => {
    const properties = { maproulette: { settings: { acknowledgedNotices: ['a', 'b'] } } }
    expect(acknowledgedNoticeIds(properties)).toEqual(['a', 'b'])
  })
})

describe('withAcknowledgedNotice', () => {
  const now = new Date('2020-01-01T00:00:00Z')

  it('adds the uuid and stamps a revision', () => {
    const updated = withAcknowledgedNotice(undefined, 'a', now)
    const app = updated.maproulette as {
      meta: { revision: number }
      settings: Record<string, unknown>
    }
    expect(app.settings.acknowledgedNotices).toEqual(['a'])
    expect(app.meta.revision).toBe(now.getTime())
  })

  it('appends to an existing list without duplicating', () => {
    const properties = { maproulette: { settings: { acknowledgedNotices: ['a'] } } }
    const once = withAcknowledgedNotice(properties, 'b', now)
    const app = once.maproulette as { settings: { acknowledgedNotices: string[] } }
    expect(app.settings.acknowledgedNotices).toEqual(['a', 'b'])
    const twice = withAcknowledgedNotice(once, 'b', now)
    const again = twice.maproulette as { settings: { acknowledgedNotices: string[] } }
    expect(again.settings.acknowledgedNotices).toEqual(['a', 'b'])
  })

  it("leaves another application's properties alone", () => {
    const properties = { otherApp: { settings: { keep: true } } }
    const updated = withAcknowledgedNotice(properties, 'a', now)
    expect(updated.otherApp).toEqual({ settings: { keep: true } })
  })

  it('preserves other settings of our own app', () => {
    const properties = { maproulette: { settings: { somethingElse: 1 } } }
    const updated = withAcknowledgedNotice(properties, 'a', now)
    const app = updated.maproulette as { settings: Record<string, unknown> }
    expect(app.settings.somethingElse).toBe(1)
  })
})
