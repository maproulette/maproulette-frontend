import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

type LegacyRedirectModule = {
  Route: {
    options: {
      beforeLoad: (ctx: { params: Record<string, string> }) => void
    }
  }
}

const legacyRoutes = import.meta.glob<LegacyRedirectModule>(
  [
    './_app/{admin,browse,c,p,superadmin,t,task,user,virtual}/**/*.tsx',
    './_app/{inbox,sent}.tsx',
    './_app/teams/index.tsx',
    './_app/challenge/*/leaderboard.tsx',
    './_app/challenge/*/task/*/*.tsx',
    './_app/project/*/leaderboard.tsx',
  ],
  { eager: true }
)

const PARAMS = {
  challengeId: '7',
  taskId: '9',
  projectId: '3',
  userId: '5',
  virtualChallengeId: '11',
}

type Expectation = {
  legacyPath: string
  to: string
  params?: Record<string, string>
  search?: Record<string, number>
}

const EXPECTATIONS: Record<string, Expectation> = {
  './_app/c/[$challengeId]/index.tsx': {
    legacyPath: '/c/7',
    to: '/challenge/$challengeId',
    params: { challengeId: '7' },
  },
  './_app/c/[$challengeId]/t/[$taskId]/index.tsx': {
    legacyPath: '/c/7/t/9',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/t/[$taskId]/index.tsx': {
    legacyPath: '/t/9',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/p/[$projectId]/index.tsx': {
    legacyPath: '/p/3',
    to: '/project/$projectId',
    params: { projectId: '3' },
  },
  './_app/browse/challenges/index.tsx': {
    legacyPath: '/browse/challenges',
    to: '/',
  },
  './_app/browse/challenges/[$challengeId]/index.tsx': {
    legacyPath: '/browse/challenges/7',
    to: '/challenge/$challengeId',
    params: { challengeId: '7' },
  },
  './_app/browse/projects/[$projectId]/index.tsx': {
    legacyPath: '/browse/projects/3',
    to: '/project/$projectId',
    params: { projectId: '3' },
  },
  './_app/task/[$taskId]/index.tsx': {
    legacyPath: '/task/9',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/task/[$taskId]/review.tsx': {
    legacyPath: '/task/9/review',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/challenge/[$challengeId]/task/[$taskId]/index.tsx': {
    legacyPath: '/challenge/7/task/9',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/challenge/[$challengeId]/task/[$taskId]/review.tsx': {
    legacyPath: '/challenge/7/task/9/review',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/challenge/[$challengeId]/task/[$taskId]/meta-review.tsx': {
    legacyPath: '/challenge/7/task/9/meta-review',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/challenge/[$challengeId]/task/[$taskId]/inspect.tsx': {
    legacyPath: '/challenge/7/task/9/inspect',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/virtual/[$virtualChallengeId]/task/[$taskId]/index.tsx': {
    legacyPath: '/virtual/11/task/9',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/challenge/[$challengeId]/leaderboard.tsx': {
    legacyPath: '/challenge/7/leaderboard',
    to: '/challenge/$challengeId',
    params: { challengeId: '7' },
  },
  './_app/project/[$projectId]/leaderboard.tsx': {
    legacyPath: '/project/3/leaderboard',
    to: '/project/$projectId',
    params: { projectId: '3' },
  },
  './_app/user/profile/index.tsx': { legacyPath: '/user/profile', to: '/profile' },
  './_app/user/profile/[$userId]/index.tsx': {
    legacyPath: '/user/profile/5',
    to: '/profile/$userId',
    params: { userId: '5' },
  },
  './_app/user/metrics/index.tsx': { legacyPath: '/user/metrics', to: '/profile' },
  './_app/user/metrics/[$userId]/index.tsx': {
    legacyPath: '/user/metrics/5',
    to: '/profile/$userId',
    params: { userId: '5' },
  },
  './_app/user/achievements/index.tsx': { legacyPath: '/user/achievements', to: '/profile' },
  './_app/user/achievements/[$userId]/index.tsx': {
    legacyPath: '/user/achievements/5',
    to: '/profile/$userId',
    params: { userId: '5' },
  },
  './_app/inbox.tsx': { legacyPath: '/inbox', to: '/notifications' },
  './_app/sent.tsx': { legacyPath: '/sent', to: '/notifications' },
  './_app/teams/index.tsx': { legacyPath: '/teams', to: '/dashboard' },
  './_app/superadmin/index.tsx': { legacyPath: '/superadmin', to: '/super-admin' },
  './_app/admin/index.tsx': { legacyPath: '/admin', to: '/manage' },
  './_app/admin/$.tsx': { legacyPath: '/admin/anything-else', to: '/manage' },
  './_app/admin/projects/index.tsx': { legacyPath: '/admin/projects', to: '/manage/projects' },
  './_app/admin/projects/new.tsx': {
    legacyPath: '/admin/projects/new',
    to: '/manage/project/new',
  },
  './_app/admin/project/[$projectId]/index.tsx': {
    legacyPath: '/admin/project/3',
    to: '/manage/project/$projectId',
    params: { projectId: '3' },
  },
  './_app/admin/project/[$projectId]/edit.tsx': {
    legacyPath: '/admin/project/3/edit',
    to: '/manage/project/$projectId/edit',
    params: { projectId: '3' },
  },
  './_app/admin/project/[$projectId]/challenges/new.tsx': {
    legacyPath: '/admin/project/3/challenges/new',
    to: '/manage/challenge/new',
    search: { projectId: 3 },
  },
  './_app/admin/project/[$projectId]/challenges/edit.tsx': {
    legacyPath: '/admin/project/3/challenges/edit',
    to: '/manage/project/$projectId',
    params: { projectId: '3' },
  },
  './_app/admin/project/[$projectId]/challenges/manage.tsx': {
    legacyPath: '/admin/project/3/challenges/manage',
    to: '/manage/project/$projectId',
    params: { projectId: '3' },
  },
  './_app/admin/project/[$projectId]/challenge/[$challengeId]/index.tsx': {
    legacyPath: '/admin/project/3/challenge/7',
    to: '/manage/challenge/$challengeId',
    params: { challengeId: '7' },
  },
  './_app/admin/project/[$projectId]/challenge/[$challengeId]/edit.tsx': {
    legacyPath: '/admin/project/3/challenge/7/edit',
    to: '/manage/challenge/$challengeId/edit',
    params: { challengeId: '7' },
  },
  './_app/admin/project/[$projectId]/challenge/[$challengeId]/clone.tsx': {
    legacyPath: '/admin/project/3/challenge/7/clone',
    to: '/manage/challenge/new',
    search: { projectId: 3 },
  },
  './_app/admin/project/[$projectId]/challenge/[$challengeId]/task/[$taskId]/edit.tsx': {
    legacyPath: '/admin/project/3/challenge/7/task/9/edit',
    to: '/manage/task/$taskId/edit',
    params: { taskId: '9' },
  },
  './_app/admin/project/[$projectId]/challenge/[$challengeId]/task/[$taskId]/inspect.tsx': {
    legacyPath: '/admin/project/3/challenge/7/task/9/inspect',
    to: '/tasks/$taskId',
    params: { taskId: '9' },
  },
  './_app/admin/virtual/project/[$projectId]/challenges/manage.tsx': {
    legacyPath: '/admin/virtual/project/3/challenges/manage',
    to: '/manage/project/$projectId',
    params: { projectId: '3' },
  },
}

describe('legacy route redirects', () => {
  it('covers every legacy redirect route file', () => {
    expect(Object.keys(legacyRoutes).sort()).toEqual(Object.keys(EXPECTATIONS).sort())
  })

  for (const [file, expectation] of Object.entries(EXPECTATIONS)) {
    it(`redirects ${expectation.legacyPath} to ${expectation.to}`, () => {
      const route = legacyRoutes[file]
      expect(route, `${file} was not picked up by the glob`).toBeDefined()

      let thrown: unknown
      try {
        route?.Route.options.beforeLoad({ params: PARAMS })
      } catch (error) {
        thrown = error
      }

      expect(isRedirect(thrown)).toBe(true)
      const { options } = thrown as { options: Record<string, unknown> }
      expect(options.to).toBe(expectation.to)
      expect(options.params).toEqual(expectation.params)
      expect(options.search).toEqual(expectation.search)
      expect(options.replace).toBe(true)
    })
  }
})
