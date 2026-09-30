/**
 * @vitest-environment happy-dom
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UserLocaleSync } from '@/components/AppLayout/UserLocaleSync'
import type { User } from '@/types/User'

const setLocale = vi.fn()
let currentLocale = 'en-US'
let currentUser: User | undefined

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: currentUser }),
}))
vi.mock('@/i18n', async () => {
  const locales = await import('@/i18n/locales')
  return {
    isSupportedLocale: locales.isSupportedLocale,
    useIntl: () => ({ locale: currentLocale, setLocale }),
  }
})

const userWithLocale = (locale?: string) =>
  ({ id: 1, settings: locale === undefined ? {} : { locale } }) as unknown as User

let container: HTMLDivElement
let root: Root
const mount = (ui: ReactNode) => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(ui)
  })
}

beforeEach(() => {
  setLocale.mockClear()
  currentLocale = 'en-US'
  currentUser = undefined
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('UserLocaleSync', () => {
  it("applies the signed-in user's saved locale", () => {
    currentUser = userWithLocale('fr')

    mount(<UserLocaleSync />)

    expect(setLocale).toHaveBeenCalledWith('fr')
  })

  it('leaves the locale alone when it already matches the saved preference', () => {
    currentLocale = 'de'
    currentUser = userWithLocale('de')

    mount(<UserLocaleSync />)

    expect(setLocale).not.toHaveBeenCalled()
  })

  it('ignores a saved locale the app has no catalog for', () => {
    currentUser = userWithLocale('xx-XX')

    mount(<UserLocaleSync />)

    expect(setLocale).not.toHaveBeenCalled()
  })

  it('leaves the locale alone when no user is signed in', () => {
    mount(<UserLocaleSync />)

    expect(setLocale).not.toHaveBeenCalled()
  })

  it('leaves the locale alone when the user has saved no preference', () => {
    currentUser = userWithLocale()

    mount(<UserLocaleSync />)

    expect(setLocale).not.toHaveBeenCalled()
  })

  it('renders nothing', () => {
    currentUser = userWithLocale('es')

    mount(<UserLocaleSync />)

    expect(container.innerHTML).toBe('')
  })
})
