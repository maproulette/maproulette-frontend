import type { QueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Challenge } from '@/types/Challenge'
import type { Task } from '@/types/Task'

/** Challenge difficulties, as stored on the challenge itself. */
export const ROULETTE_DIFFICULTIES = [1, 2, 3] as const
export type RouletteDifficulty = (typeof ROULETTE_DIFFICULTIES)[number]

const CANDIDATE_POOL_SIZE = 50
/** Challenges tried before the spin gives up, so one dead challenge isn't fatal. */
const MAX_CHALLENGE_ATTEMPTS = 4

/** Challenges a mapper could actually be dropped into right now. */
export const startableChallenges = (challenges: Challenge[]): Challenge[] =>
  challenges.filter(
    (challenge) => !challenge.paused && (challenge.completionMetrics?.tasksRemaining ?? 1) > 0
  )

export interface RouletteResult {
  task: Task
  challenge: Challenge
}

/**
 * A random task from a random challenge of the given difficulty.
 *
 * `GET /tasks/random` builds its search parameters from its own route args and has no
 * difficulty among them, so difficulty is applied by choosing the challenge first and
 * then spinning inside it. Candidates that hand back no task (all remaining tasks
 * locked by others, for instance) fall through to the next one.
 */
export const fetchRandomTaskByDifficulty = async (
  difficulty: RouletteDifficulty,
  queryClient: QueryClient,
  random: () => number = Math.random
): Promise<RouletteResult | null> => {
  const challenges = await api.challenge.fetchChallengesByDifficulty(
    difficulty,
    CANDIDATE_POOL_SIZE
  )
  const candidates = startableChallenges(challenges)

  for (let attempt = 0; attempt < MAX_CHALLENGE_ATTEMPTS && candidates.length > 0; attempt += 1) {
    const [challenge] = candidates.splice(Math.floor(random() * candidates.length), 1)
    const tasks = await api.challenge.getRandomTask(challenge.id, queryClient)
    if (tasks[0]) return { task: tasks[0], challenge }
  }

  return null
}
