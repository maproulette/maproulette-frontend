import { describe, expect, it } from 'vitest'
import { isCoreAppPath } from './pluginRoutes'

describe('isCoreAppPath', () => {
  it('treats the app root as a core path', () => {
    expect(isCoreAppPath('/')).toBe(true)
  })

  it.each([
    '/tasks',
    '/tasks/42',
    '/challenge/1',
    '/project/1',
    '/manage',
    '/manage/projects',
    '/teams',
    '/profile/someone',
    '/dashboard',
    '/settings',
    '/notifications',
    '/super-admin/challenges',
  ])('claims %s for the app', (pathname) => {
    expect(isCoreAppPath(pathname)).toBe(true)
  })

  it.each(['/my-plugin', '/plugins/foo', '/tasksomething', '/challenges', ''])(
    'leaves %s to the plugin catch-all',
    (pathname) => {
      expect(isCoreAppPath(pathname)).toBe(false)
    }
  )
})
