import { useNavigate } from '@tanstack/react-router'

/**
 * Navigates to a task's edit page, claiming it by default (setting `claimTask=true` so
 * TaskContext's auto-lock effect attempts to lock it) - this is what every "start"-style
 * action (Start Task, Start Challenge, Complete & Continue, Skip, nearby/random task nav,
 * lock-conflict "go back") wants. Pass `claim: false` for a rare read-only navigation that
 * should just view the task without attempting a lock.
 */
export const useNavigateToTask = () => {
  const navigate = useNavigate()

  return (taskId: number | string, opts: { claim?: boolean } = {}) => {
    const { claim = true } = opts
    return navigate({
      to: '/tasks/$taskId',
      params: { taskId: String(taskId) },
      search: claim ? { claimTask: true } : undefined,
    })
  }
}
