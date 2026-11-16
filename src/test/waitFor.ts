import { act } from 'react'

/**
 * Polls `callback` (expected to throw, e.g. via `expect()`, until it passes)
 * inside `act` so async state updates (query/mutation resolution) get flushed
 * between attempts. Replaces `@testing-library/react`'s `waitFor`.
 */
export async function waitFor(
  callback: () => void,
  options?: { timeout?: number; interval?: number }
) {
  const timeout = options?.timeout ?? 1000
  const interval = options?.interval ?? 10
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      callback()
      return
    } catch {
      // not ready yet — flush pending async work and retry
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, interval))
    })
  }

  callback()
}
