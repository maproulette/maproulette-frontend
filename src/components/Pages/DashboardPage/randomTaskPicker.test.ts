import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRandomTaskByDifficulty, startableChallenges } from './randomTaskPicker'

const { fetchChallengesByDifficulty, getRandomTask } = vi.hoisted(() => ({
  fetchChallengesByDifficulty: vi.fn(),
  getRandomTask: vi.fn(),
}))

vi.mock('@/api', () => ({
  api: { challenge: { fetchChallengesByDifficulty, getRandomTask } },
}))

// Only the fields the picker reads matter here.
const challenge = (id: number, extra: Record<string, unknown> = {}) =>
  ({ id, paused: false, ...extra }) as unknown as Parameters<typeof startableChallenges>[0][number]

const queryClient = {} as Parameters<typeof fetchRandomTaskByDifficulty>[1]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('startableChallenges', () => {
  it('drops paused challenges and ones with nothing left to work on', () => {
    const challenges = [
      challenge(1),
      challenge(2, { paused: true }),
      challenge(3, { completionMetrics: { tasksRemaining: 0 } }),
      challenge(4, { completionMetrics: { tasksRemaining: 7 } }),
    ]

    expect(startableChallenges(challenges).map((c) => c.id)).toEqual([1, 4])
  })
})

describe('fetchRandomTaskByDifficulty', () => {
  it('fetches challenges at the requested difficulty and returns a task from one of them', async () => {
    fetchChallengesByDifficulty.mockResolvedValue([challenge(11), challenge(12)])
    getRandomTask.mockResolvedValue([{ id: 99 }])

    const picked = await fetchRandomTaskByDifficulty(3, queryClient, () => 0)

    expect(picked?.task).toEqual({ id: 99 })
    expect(picked?.challenge.id).toBe(11)
    expect(fetchChallengesByDifficulty).toHaveBeenCalledWith(3, 50)
    expect(getRandomTask).toHaveBeenCalledWith(11, queryClient)
  })

  it('moves on to another challenge when the first hands back no task', async () => {
    fetchChallengesByDifficulty.mockResolvedValue([challenge(11), challenge(12)])
    getRandomTask.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 42 }])

    const picked = await fetchRandomTaskByDifficulty(1, queryClient, () => 0)

    expect(picked?.task).toEqual({ id: 42 })
    // The challenge that actually produced the task, not the one that came up empty.
    expect(picked?.challenge.id).toBe(12)
    expect(getRandomTask.mock.calls.map((call) => call[0])).toEqual([11, 12])
  })

  it('gives up after exhausting the candidates without fetching the same challenge twice', async () => {
    fetchChallengesByDifficulty.mockResolvedValue([challenge(11), challenge(12)])
    getRandomTask.mockResolvedValue([])

    expect(await fetchRandomTaskByDifficulty(2, queryClient, () => 0)).toBeNull()
    expect(getRandomTask.mock.calls.map((call) => call[0])).toEqual([11, 12])
  })

  it('returns null when no challenge at that difficulty is startable', async () => {
    fetchChallengesByDifficulty.mockResolvedValue([challenge(11, { paused: true })])

    expect(await fetchRandomTaskByDifficulty(2, queryClient, () => 0)).toBeNull()
    expect(getRandomTask).not.toHaveBeenCalled()
  })
})
