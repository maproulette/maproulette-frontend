import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { refreshChallenge } from '@/api/challenge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Panel } from '@/components/ui/Panel'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import {
  CHALLENGE_STATUS_BUILDING,
  CHALLENGE_STATUS_DELETING_TASKS,
  CHALLENGE_STATUS_FAILED,
  CHALLENGE_STATUS_FINISHED,
  CHALLENGE_STATUS_NONE,
  CHALLENGE_STATUS_PARTIALLY_LOADED,
  CHALLENGE_STATUS_READY,
} from '@/lib/challengeStatus'
import type { Challenge } from '@/types/Challenge'

const TASKS_UPDATING_MESSAGE = 'Updating Task Statuses'

// Statuses that are not yet final; the challenge may still transition out of
// these and the UI should keep polling for updates until it does.
const NON_TERMINAL_STATUSES = [
  CHALLENGE_STATUS_BUILDING,
  CHALLENGE_STATUS_PARTIALLY_LOADED,
  CHALLENGE_STATUS_DELETING_TASKS,
]

interface ChallengeStatusIndicatorProps {
  challenge: Challenge
  challengeId: number
}

export const ChallengeStatusIndicator = ({
  challenge,
  challengeId,
}: ChallengeStatusIndicatorProps) => {
  const { t } = useIntl()
  const queryClient = useQueryClient()
  const [startTime, setStartTime] = useState(Date.now())
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [currentTime, setCurrentTime] = useState(Date.now())
  const hasInitialRefresh = useRef(false)
  const wasNonTerminal = useRef(false)

  const status = challenge.status ?? CHALLENGE_STATUS_NONE
  const statusMessage = challenge.statusMessage

  useEffect(() => {
    hasInitialRefresh.current = false
    wasNonTerminal.current = false
    setStartTime(Date.now())
  }, [challengeId])

  useEffect(() => {
    if (!hasInitialRefresh.current && NON_TERMINAL_STATUSES.includes(status)) {
      refreshChallenge(challengeId, queryClient, { includeTaskMarkers: false })
      setLastRefresh(Date.now())
      hasInitialRefresh.current = true
    }
  }, [status, challengeId])

  // Auto-refresh every 10 seconds while the challenge is in any non-terminal status
  useEffect(() => {
    if (!NON_TERMINAL_STATUSES.includes(status)) return
    const refreshInterval = setInterval(() => {
      refreshChallenge(challengeId, queryClient, { includeTaskMarkers: false })
      setLastRefresh(Date.now())
    }, 10000) // 10 seconds
    return () => clearInterval(refreshInterval)
  }, [status, challengeId])

  useEffect(() => {
    const nonTerminal = NON_TERMINAL_STATUSES.includes(status)
    if (wasNonTerminal.current && !nonTerminal) {
      refreshChallenge(challengeId, queryClient)
    }
    wasNonTerminal.current = nonTerminal
  }, [status, challengeId])

  // Update current time every second for countdown display
  useEffect(() => {
    if (status !== CHALLENGE_STATUS_BUILDING) return
    const tickInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000) // Update every second
    return () => clearInterval(tickInterval)
  }, [status])

  // Don't show anything if status is ready, none, or finished
  if (
    status === CHALLENGE_STATUS_READY ||
    status === CHALLENGE_STATUS_NONE ||
    status === CHALLENGE_STATUS_FINISHED ||
    !status
  ) {
    return null
  }

  // Building status
  if (status === CHALLENGE_STATUS_BUILDING) {
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
    const nextUpdateSeconds = Math.max(0, Math.floor((lastRefresh + 10000 - currentTime) / 1000))

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const isUpdating = statusMessage === TASKS_UPDATING_MESSAGE

    return (
      <Alert className="mb-4 border-accent bg-accent/10">
        <Spinner className="text-link" />
        <AlertTitle className="flex items-center gap-2 text-fg">
          {isUpdating
            ? t({
                id: 'manageChallengeDetail.statusIndicator.tasksUpdatingTitle',
                defaultMessage: 'Tasks Updating...',
              })
            : t({
                id: 'manageChallengeDetail.statusIndicator.tasksBuildingTitle',
                defaultMessage: 'Tasks Building...',
              })}
        </AlertTitle>
        <AlertDescription className="space-y-2 text-fg">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">
              {t({
                id: 'manageChallengeDetail.statusIndicator.elapsedTimeLabel',
                defaultMessage: 'Elapsed time:',
              })}{' '}
              <strong>{formatDuration(elapsedSeconds)}</strong>
            </span>
            <span className="text-sm">
              {t({
                id: 'manageChallengeDetail.statusIndicator.refreshingInLabel',
                defaultMessage: 'Refreshing in:',
              })}{' '}
              <strong className="text-warning">{formatDuration(nextUpdateSeconds)}</strong>
            </span>
          </div>
          {!isUpdating && (
            <div className="text-sm">
              {t({
                id: 'manageChallengeDetail.statusIndicator.buildingBody',
                defaultMessage:
                  'Tasks are being generated. This page will automatically refresh to show progress.',
              })}
            </div>
          )}
          {isUpdating && (
            <div className="text-sm">
              {t({
                id: 'manageChallengeDetail.statusIndicator.updatingBody',
                defaultMessage:
                  'Task statuses are being updated. This page will automatically refresh to show progress.',
              })}
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Failed status
  if (status === CHALLENGE_STATUS_FAILED) {
    // Helper function to strip HTML tags and decode entities (works in React/SSR)
    const sanitizeMessage = (message: string | null | undefined): string => {
      if (!message) return ''
      let decoded = message
      // First, decode common HTML entities
      decoded = decoded
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      // Remove all HTML tags
      decoded = decoded.replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      decoded = decoded.replace(/\s+/g, ' ').trim()
      return decoded
    }

    const sanitizedMessage = sanitizeMessage(statusMessage)

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {t({
            id: 'manageChallengeDetail.statusIndicator.failedTitle',
            defaultMessage: 'Tasks Failed to Build',
          })}
        </AlertTitle>
        <AlertDescription>
          {sanitizedMessage ? (
            <Panel
              tone="danger"
              padding="sm"
              className="mt-2 max-h-64 overflow-y-auto overflow-x-hidden"
            >
              <pre className="whitespace-pre-wrap break-words break-all text-xs">
                {sanitizedMessage}
              </pre>
            </Panel>
          ) : (
            <p className="mt-2 text-sm">
              {t({
                id: 'manageChallengeDetail.statusIndicator.failedBody',
                defaultMessage:
                  'The challenge failed to build tasks. Please check the challenge configuration and try again.',
              })}
            </p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Partially loaded status
  if (status === CHALLENGE_STATUS_PARTIALLY_LOADED) {
    return (
      <Alert className="mb-4 border-warning/40 bg-warning/10">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertTitle>
          {t({
            id: 'manageChallengeDetail.statusIndicator.partiallyLoadedTitle',
            defaultMessage: 'Challenge Partially Loaded',
          })}
        </AlertTitle>
        <AlertDescription className="text-fg">
          <p className="text-sm">
            {t({
              id: 'manageChallengeDetail.statusIndicator.partiallyLoadedBody',
              defaultMessage:
                'This challenge is partially loaded. Some tasks may not be available yet.',
            })}
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Deleting tasks status
  if (status === CHALLENGE_STATUS_DELETING_TASKS) {
    return (
      <Alert className="mb-4 border-warning/40 bg-warning/10">
        <Spinner className="text-warning" />
        <AlertTitle>
          {t({
            id: 'manageChallengeDetail.statusIndicator.deletingTitle',
            defaultMessage: 'Deleting Tasks...',
          })}
        </AlertTitle>
        <AlertDescription className="text-fg">
          <p className="text-sm">
            {t({
              id: 'manageChallengeDetail.statusIndicator.deletingBody',
              defaultMessage: 'Tasks are being deleted. Please wait...',
            })}
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
