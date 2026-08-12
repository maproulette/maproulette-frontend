// @vitest-environment happy-dom
import type { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { invalidateChallengeAggregates, patchChallengeTaskMarker } from '@/api/challenge/single'
import { type AuthContextType, useAuthContext } from '@/contexts/AuthContext'
import { useCongratulate } from '@/contexts/CongratulateContext'
import { useWebSocketContext } from '@/contexts/WebSocketContext'
import { wsLogger } from '@/lib/logger'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import type { TaskGetResponse } from '@/types/Task'
import type {
  AchievementAwardedMessage,
  NotificationNewMessage,
  ReviewEventMessage,
  TaskEventMessage,
  TasksEventMessage,
  TeamUpdateMessage,
  WebSocketMessageTypes,
} from '@/types/WebSocket'
import { useWebSocketEvents } from './useWebSocketEvents'

vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: vi.fn() }))
vi.mock('@/contexts/CongratulateContext', () => ({ useCongratulate: vi.fn() }))
vi.mock('@/contexts/WebSocketContext', () => ({ useWebSocketContext: vi.fn() }))
vi.mock('@/api/challenge/single', () => ({
  invalidateChallengeAggregates: vi.fn(),
  patchChallengeTaskMarker: vi.fn(),
}))
vi.mock('@/lib/logger', () => ({ wsLogger: { warn: vi.fn() } }))

const fakeUser = (id: number): AuthContextType['user'] =>
  ({ id }) as unknown as AuthContextType['user']

const mockAuth = (user: AuthContextType['user']) => {
  vi.mocked(useAuthContext).mockReturnValue({
    user,
    isAuthenticated: !!user,
    authLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  })
}

const mockCongratulate = (enqueue = vi.fn()) => {
  vi.mocked(useCongratulate).mockReturnValue({
    current: null,
    enqueue,
    dismiss: vi.fn(),
  })
  return enqueue
}

const mockWebSocket = (
  lastMessage: WebSocketMessageTypes | null,
  subscribe: (name: string) => void = vi.fn()
) => {
  vi.mocked(useWebSocketContext).mockReturnValue({
    lastMessage,
    readyState: 1,
    sendMessage: vi.fn(),
    subscribe,
  } as unknown as ReturnType<typeof useWebSocketContext>)
  return subscribe
}

const mount = (queryClient: QueryClient = createTestQueryClient()) => {
  const rendered = renderHook(() => useWebSocketEvents(), {
    wrapper: queryClientWrapper(queryClient),
  })
  return { ...rendered, queryClient }
}

describe('useWebSocketEvents', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('subscribes to the tasks stream on mount', () => {
    mockAuth(undefined)
    mockCongratulate()
    const subscribe = mockWebSocket(null)

    mount()

    expect(subscribe).toHaveBeenCalledWith('tasks')
  })

  it('does nothing when there is no lastMessage', () => {
    mockAuth(undefined)
    mockCongratulate()
    mockWebSocket(null)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mount(queryClient)

    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('ignores a non-object lastMessage', () => {
    mockAuth(undefined)
    mockCongratulate()
    mockWebSocket('not-an-object' as unknown as WebSocketMessageTypes)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    expect(() => mount(queryClient)).not.toThrow()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  describe('achievement-awarded', () => {
    const message = (userId: number): AchievementAwardedMessage => ({
      messageType: 'achievement-awarded',
      data: { userId, achievement: [1, 2] },
    })

    it('enqueues each achievement and invalidates user queries when it is for the current user', () => {
      mockAuth(fakeUser(7))
      const enqueue = mockCongratulate()
      mockWebSocket(message(7))
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(enqueue).toHaveBeenCalledWith({ kind: 'achievement', achievementId: 1 })
      expect(enqueue).toHaveBeenCalledWith({ kind: 'achievement', achievementId: 2 })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'whoami'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 7] })
    })

    it('does nothing when the achievement is for a different user', () => {
      mockAuth(fakeUser(7))
      const enqueue = mockCongratulate()
      mockWebSocket(message(99))
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(enqueue).not.toHaveBeenCalled()
      expect(invalidateSpy).not.toHaveBeenCalled()
    })

    it('does nothing when there is no current user', () => {
      mockAuth(undefined)
      const enqueue = mockCongratulate()
      mockWebSocket(message(7))
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(enqueue).not.toHaveBeenCalled()
      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })

  describe('task events', () => {
    const taskEvent = (overrides: Partial<TaskEventMessage['data']> = {}): TaskEventMessage => ({
      messageType: 'task-claimed',
      data: {
        task: { id: 1, parent: 10, status: 2 },
        challenge: null,
        project: null,
        byUser: { userId: 5, osmId: 1, displayName: 'x', avatarURL: '' },
        ...overrides,
      },
    })

    it('locks the marker on task-claimed without touching status (lock events carry a stale status snapshot)', () => {
      mockAuth(undefined)
      mockCongratulate()
      const msg = taskEvent()
      mockWebSocket(msg)
      const queryClient = createTestQueryClient()
      queryClient.setQueryData<TaskGetResponse>(['task', 1], {
        id: 1,
        parent: 10,
        status: 0,
      } as TaskGetResponse)

      mount(queryClient)

      // Status is left untouched - only task-update / task-completed drive status.
      expect(queryClient.getQueryData<TaskGetResponse>(['task', 1])).toEqual({
        id: 1,
        parent: 10,
        status: 0,
      })
      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(queryClient, 10, 1, {
        lockedBy: 5,
      })
    })

    it('does not let a stale task-released status snapshot clobber a newer cached status', () => {
      mockAuth(undefined)
      mockCongratulate()
      // Backend snapshots the task before the status change, so the release carries the old
      // status (0). The cache already holds the fresh status (1) from the mutation response.
      mockWebSocket({
        ...taskEvent({ task: { id: 1, parent: 10, status: 0 } }),
        messageType: 'task-released',
      })
      const queryClient = createTestQueryClient()
      queryClient.setQueryData<TaskGetResponse>(['task', 1], {
        id: 1,
        parent: 10,
        status: 1,
      } as TaskGetResponse)

      mount(queryClient)

      expect(queryClient.getQueryData<TaskGetResponse>(['task', 1])?.status).toBe(1)
      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(
        queryClient,
        10,
        1,
        expect.not.objectContaining({ status: expect.anything() })
      )
    })

    it('locks with null when task-claimed has no byUser', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(taskEvent({ byUser: null }))
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(
        queryClient,
        10,
        1,
        expect.objectContaining({ lockedBy: null })
      )
    })

    it('unlocks on task-released', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        ...taskEvent(),
        messageType: 'task-released',
      })
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(
        queryClient,
        10,
        1,
        expect.objectContaining({ lockedBy: null })
      )
    })

    it('derives the challenge id from data.challenge when present', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(taskEvent({ challenge: { id: 55, parentId: 1, name: 'c', enabled: true } }))
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(queryClient, 55, 1, expect.anything())
    })

    it('does not patch the marker on task-update when status is unchanged and no lock info applies', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        messageType: 'task-update',
        data: {
          task: { id: 1, parent: 10, status: undefined },
          challenge: null,
          project: null,
          byUser: null,
        },
      })
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).not.toHaveBeenCalled()
    })

    it('invalidates task history regardless of status change', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(taskEvent())
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 1] })
    })

    it('invalidates challenge aggregates only when the status actually changed', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(taskEvent({ task: { id: 1, parent: 10, status: 2 } }))
      const queryClient = createTestQueryClient()
      queryClient.setQueryData<TaskGetResponse>(['task', 1], {
        id: 1,
        parent: 10,
        status: 2,
      } as TaskGetResponse)

      mount(queryClient)

      expect(invalidateChallengeAggregates).not.toHaveBeenCalled()
    })

    it('invalidates challenge aggregates when the status changed', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        ...taskEvent({ task: { id: 1, parent: 10, status: 2 } }),
        messageType: 'task-update',
      })
      const queryClient = createTestQueryClient()
      queryClient.setQueryData<TaskGetResponse>(['task', 1], {
        id: 1,
        parent: 10,
        status: 0,
      } as TaskGetResponse)

      mount(queryClient)

      expect(invalidateChallengeAggregates).toHaveBeenCalledWith(queryClient, 10)
    })

    it('does not invalidate challenge aggregates when newStatus is undefined', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(taskEvent({ task: { id: 1, parent: 10, status: undefined } }))
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(invalidateChallengeAggregates).not.toHaveBeenCalled()
    })

    it('invalidates whoami/user on task-completed by the current user', () => {
      mockAuth(fakeUser(5))
      mockCongratulate()
      mockWebSocket({
        ...taskEvent({ byUser: { userId: 5, osmId: 1, displayName: 'x', avatarURL: '' } }),
        messageType: 'task-completed',
      })
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'whoami'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 5] })
    })

    it('does not invalidate whoami/user on task-completed by a different user', () => {
      mockAuth(fakeUser(5))
      mockCongratulate()
      mockWebSocket({
        ...taskEvent({ byUser: { userId: 99, osmId: 1, displayName: 'x', avatarURL: '' } }),
        messageType: 'task-completed',
      })
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['user', 'whoami'] })
    })
  })

  describe('tasks events (bundled)', () => {
    const tasksEvent = (overrides: Partial<TasksEventMessage['data']> = {}): TasksEventMessage => ({
      messageType: 'tasks-claimed',
      data: {
        tasks: [{ id: 1, parent: 10, status: 2 }],
        challenge: null,
        project: null,
        byUser: { userId: 5, osmId: 1, displayName: 'x', avatarURL: '' },
        ...overrides,
      },
    })

    it('patches each cached bundled task status, patches its marker, invalidates history for all of them, and dedupes aggregate invalidation within the same challenge', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        ...tasksEvent({
          tasks: [
            { id: 1, parent: 10, status: 2, bundleId: 99, isBundlePrimary: true },
            { id: 2, parent: 10, status: 2 },
          ],
        }),
        messageType: 'tasks-update',
      })
      const queryClient = createTestQueryClient()
      queryClient.setQueryData<TaskGetResponse>(['task', 1], {
        id: 1,
        parent: 10,
        status: 0,
      } as TaskGetResponse)
      queryClient.setQueryData<TaskGetResponse>(['task', 2], {
        id: 2,
        parent: 10,
        status: 0,
        bundleId: 50,
      } as TaskGetResponse)
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(queryClient.getQueryData<TaskGetResponse>(['task', 1])).toEqual({
        id: 1,
        parent: 10,
        status: 2,
        bundleId: 99,
        isBundlePrimary: true,
      })
      // Task 2's message has no bundleId/isBundlePrimary, so the cached values carry over.
      expect(queryClient.getQueryData<TaskGetResponse>(['task', 2])).toEqual({
        id: 2,
        parent: 10,
        status: 2,
        bundleId: 50,
        isBundlePrimary: undefined,
      })

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(queryClient, 10, 1, {
        status: 2,
      })
      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(queryClient, 10, 2, {
        status: 2,
      })

      const historyCall = invalidateSpy.mock.calls.find(
        ([arg]) => typeof (arg as { predicate?: unknown })?.predicate === 'function'
      )
      expect(historyCall).toBeDefined()
      const predicate = (
        historyCall?.[0] as unknown as { predicate: (q: { queryKey: unknown[] }) => boolean }
      ).predicate
      expect(predicate({ queryKey: ['task', 'history', 1] })).toBe(true)
      expect(predicate({ queryKey: ['task', 'history', 2] })).toBe(true)
      expect(predicate({ queryKey: ['task', 'history', 3] })).toBe(false)
      expect(predicate({ queryKey: ['challenge', 10] })).toBe(false)

      // Both tasks changed status within the same challenge; only invalidated once.
      expect(invalidateChallengeAggregates).toHaveBeenCalledTimes(1)
      expect(invalidateChallengeAggregates).toHaveBeenCalledWith(queryClient, 10)
    })

    it('clears lockedBy on tasks-released and skips aggregate invalidation when status is unchanged', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        ...tasksEvent({ tasks: [{ id: 1, parent: 10, status: 2 }] }),
        messageType: 'tasks-released',
      })
      const queryClient = createTestQueryClient()
      queryClient.setQueryData<TaskGetResponse>(['task', 1], {
        id: 1,
        parent: 10,
        status: 2,
      } as TaskGetResponse)

      mount(queryClient)

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(
        queryClient,
        10,
        1,
        expect.objectContaining({ lockedBy: null })
      )
      expect(invalidateChallengeAggregates).not.toHaveBeenCalled()
    })

    it('skips the cache patch for a bundled task with no cache entry', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(tasksEvent({ tasks: [{ id: 42, parent: 10, status: 2 }] }))
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(queryClient.getQueryData(['task', 42])).toBeUndefined()
      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(queryClient, 10, 42, {
        lockedBy: 5,
      })
    })

    it('leaves lockedBy unset on tasks-update, only patching status', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        ...tasksEvent({ tasks: [{ id: 1, parent: 10, status: 2 }] }),
        messageType: 'tasks-update',
      })
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(queryClient, 10, 1, { status: 2 })
    })

    it('falls back to the cached status and skips the status key on the marker patch when the bundled task has no status', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(tasksEvent({ tasks: [{ id: 1, parent: 10, status: undefined }] }))
      const queryClient = createTestQueryClient()
      queryClient.setQueryData<TaskGetResponse>(['task', 1], {
        id: 1,
        parent: 10,
        status: 5,
      } as TaskGetResponse)

      mount(queryClient)

      expect(queryClient.getQueryData<TaskGetResponse>(['task', 1])?.status).toBe(5)
      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(
        queryClient,
        10,
        1,
        expect.not.objectContaining({ status: expect.anything() })
      )
    })

    it('locks with null when tasks-claimed has no byUser', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(tasksEvent({ tasks: [{ id: 1, parent: 10, status: 2 }], byUser: null }))
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(
        queryClient,
        10,
        1,
        expect.objectContaining({ lockedBy: null })
      )
    })

    it('skips the marker patch entirely when tasks-update leaves an empty patch', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        ...tasksEvent({ tasks: [{ id: 1, parent: 10, status: undefined }] }),
        messageType: 'tasks-update',
      })
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).not.toHaveBeenCalled()
    })

    it('skips the history invalidation and marker patches entirely for an empty bundle', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(tasksEvent({ tasks: [] }))
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(patchChallengeTaskMarker).not.toHaveBeenCalled()
      expect(invalidateSpy).not.toHaveBeenCalled()
    })

    it('derives the challenge id from data.challenge, taking priority over each task.parent', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket({
        ...tasksEvent({
          challenge: { id: 77, parentId: 1, name: 'c', enabled: true },
          tasks: [{ id: 1, parent: 10, status: 2 }],
        }),
        messageType: 'tasks-update',
      })
      const queryClient = createTestQueryClient()

      mount(queryClient)

      expect(patchChallengeTaskMarker).toHaveBeenCalledWith(queryClient, 77, 1, expect.anything())
      expect(invalidateChallengeAggregates).toHaveBeenCalledWith(queryClient, 77)
    })

    it('invalidates own user queries on tasks-completed by the current user, not by another user', () => {
      mockAuth(fakeUser(5))
      mockCongratulate()
      mockWebSocket({
        ...tasksEvent({ byUser: { userId: 5, osmId: 1, displayName: 'x', avatarURL: '' } }),
        messageType: 'tasks-completed',
      })
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'whoami'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 5] })
    })

    it('does not invalidate own user queries on tasks-completed by a different user', () => {
      mockAuth(fakeUser(5))
      mockCongratulate()
      mockWebSocket({
        ...tasksEvent({ byUser: { userId: 99, osmId: 1, displayName: 'x', avatarURL: '' } }),
        messageType: 'tasks-completed',
      })
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['user', 'whoami'] })
    })
  })

  describe('review events', () => {
    const reviewMsg = (messageType: ReviewEventMessage['messageType']): ReviewEventMessage => ({
      messageType,
      data: { taskWithReview: { task: { id: 3, parent: 20, status: 1 } } },
    })

    it.each(['review-new', 'review-claimed', 'review-update'] as const)(
      'invalidates task and challenge aggregates on %s',
      (messageType) => {
        mockAuth(undefined)
        mockCongratulate()
        mockWebSocket(reviewMsg(messageType))
        const queryClient = createTestQueryClient()
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

        mount(queryClient)

        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 3] })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 3] })
        expect(invalidateChallengeAggregates).toHaveBeenCalledWith(queryClient, 20)
      }
    )
  })

  describe('team-update', () => {
    const teamMsg: TeamUpdateMessage = {
      messageType: 'team-update',
      data: { teamId: 8, userId: null },
    }

    it('invalidates the team and the current user membership query', () => {
      mockAuth(fakeUser(4))
      mockCongratulate()
      mockWebSocket(teamMsg)
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team', 8] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 4, 'teamMemberships'] })
    })

    it('invalidates with an undefined user id when there is no current user', () => {
      mockAuth(undefined)
      mockCongratulate()
      mockWebSocket(teamMsg)
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['user', undefined, 'teamMemberships'],
      })
    })
  })

  describe('notification-new', () => {
    it('invalidates the notifications query', () => {
      mockAuth(undefined)
      mockCongratulate()
      const msg: NotificationNewMessage = {
        messageType: 'notification-new',
        data: { userId: 1 },
      }
      mockWebSocket(msg)
      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      mount(queryClient)

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'notifications'] })
    })
  })

  it('ignores message types with no matching dispatcher, such as pong', () => {
    mockAuth(undefined)
    mockCongratulate()
    mockWebSocket({ messageType: 'pong', data: null })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    expect(() => mount(queryClient)).not.toThrow()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('swallows errors thrown while dispatching and logs them', () => {
    mockAuth(fakeUser(1))
    mockCongratulate(
      vi.fn(() => {
        throw new Error('boom')
      })
    )
    mockWebSocket({
      messageType: 'achievement-awarded',
      data: { userId: 1, achievement: [1] },
    })

    expect(() => mount()).not.toThrow()
    expect(wsLogger.warn).toHaveBeenCalledWith(
      'WebSocket dispatch error',
      expect.objectContaining({ error: expect.any(Error) })
    )
  })

  it('does not reprocess the same message object across re-renders', () => {
    const msg: NotificationNewMessage = {
      messageType: 'notification-new',
      data: { userId: 1 },
    }
    mockAuth(fakeUser(1))
    mockCongratulate()
    mockWebSocket(msg)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { rerender } = mount(queryClient)
    expect(invalidateSpy).toHaveBeenCalledTimes(1)

    mockAuth(fakeUser(2))
    rerender()

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })
})
