/**
 * @vitest-environment happy-dom
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type AuthContextType, useAuthContext } from '@/contexts/AuthContext'
import { IntlProvider } from '@/i18n'
import { Achievement } from '@/types/Achievement'
import { AchievementToasts } from './AchievementToasts'

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: vi.fn() }))

let user: Partial<AuthContextType['user']> | undefined

const setUser = (achievements: number[], id = 1) => {
  user = { id, achievements }
  vi.mocked(useAuthContext).mockImplementation(
    () => ({ user, isAuthenticated: !!user }) as unknown as AuthContextType
  )
}

describe('AchievementToasts', () => {
  let container: HTMLDivElement
  let root: Root

  const render = () => {
    act(() => {
      root.render(
        <IntlProvider initialLocale="en-US">
          <AchievementToasts />
        </IntlProvider>
      )
    })
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.clearAllMocks()
  })

  it('does not announce the badges the user already has when they are first seen', () => {
    setUser([Achievement.fixedTask, Achievement.points100])

    render()

    expect(toast.success).not.toHaveBeenCalled()
  })

  it('announces a badge that appears on a later render', () => {
    setUser([Achievement.fixedTask])
    render()

    setUser([Achievement.fixedTask, Achievement.fixedCoopTask])
    render()

    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith(
      'Cooperative Fixer',
      expect.objectContaining({ description: 'Fixed a cooperative task.' })
    )
  })

  it('does not announce anything when the badge list is unchanged', () => {
    setUser([Achievement.fixedTask])
    render()

    setUser([Achievement.fixedTask])
    render()

    expect(toast.success).not.toHaveBeenCalled()
  })

  it('treats a different signed-in user as a fresh start', () => {
    setUser([Achievement.fixedTask], 1)
    render()

    setUser([Achievement.points100], 2)
    render()

    expect(toast.success).not.toHaveBeenCalled()
  })
})
