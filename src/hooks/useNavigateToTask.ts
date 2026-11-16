import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

/**
 * Navigates to a task's edit page, claiming it by default (setting `claimTask=true` so
 * TaskContext's auto-lock effect attempts to lock it) - this is what every "start"-style
 * action (Start Task, Start Challenge, Complete & Continue, Skip, nearby/random task nav,
 * lock-conflict "go back") wants. Pass `claim: false` for a rare read-only navigation that
 * should just view the task without attempting a lock.
 *
 * Reason: memoized because callers thread it through useCallback/useMemo deps that feed
 * effect dependencies - notably useSkipTask -> useTaskShortcuts -> useRegisterShortcuts.
 * A fresh identity each render re-registers the shortcut group on every render, and the
 * registry re-renders its consumers when a group changes, which is an endless loop.
 */
export const useNavigateToTask = () => {
  const navigate = useNavigate()

  return useCallback(
    (taskId: number | string, opts: { claim?: boolean } = {}) => {
      const { claim = true } = opts
      return navigate({
        to: '/tasks/$taskId',
        params: { taskId: String(taskId) },
        search: claim ? { claimTask: true } : undefined,
      })
    },
    [navigate]
  )
}
