import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import type { TaskPriorityValue } from '@/types/Priority'
import type { TaskMarker } from '@/types/Task'
import { analyzeWarnings, type PrioritizationWarnings } from './evaluation/ruleAnalysis'
import { usePrioritizationContext } from './PrioritizationContext'
import { draftToPriorityBody } from './prioritizationParsing'

export interface PreviewResult {
  /** Computed priority keyed by task id (server-evaluated). */
  byTaskId: Map<number, TaskPriorityValue>
  /** Number of tasks falling into each tier. */
  counts: Record<TaskPriorityValue, number>
  /** Tasks whose computed priority differs from their current server-stored priority. */
  changedCount: number
  warnings: PrioritizationWarnings
  /** True while the backend preview is in flight for the current draft. */
  isEvaluating: boolean
}

const EMPTY_COUNTS: Record<TaskPriorityValue, number> = { 0: 0, 1: 0, 2: 0 }

interface TaskPreviewContextValue {
  isLoading: boolean
  markers: TaskMarker[]
  preview: PreviewResult
}

const TaskPreviewContext = createContext<TaskPreviewContextValue | null>(null)

// Debounce rule edits before sending to the backend. The preview endpoint
// iterates every task in the challenge, so tight feedback is cheap only for
// small challenges — 250 ms gives a responsive feel without hammering the
// server on every keystroke of a rule value.
const DEBOUNCE_MS = 250

export const TaskPreviewProvider = ({
  children,
  markers,
  isLoading,
  challengeId,
}: {
  children: ReactNode
  markers: TaskMarker[]
  isLoading: boolean
  challengeId: number
}) => {
  const { draft } = usePrioritizationContext()
  const [debouncedDraft, setDebouncedDraft] = useState(draft)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedDraft(draft), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [draft])

  // Stable body reference so the query key only changes when the debounced
  // draft genuinely changes shape.
  const previewBody = useMemo(() => draftToPriorityBody(debouncedDraft), [debouncedDraft])
  const previewQuery = api.challenge.usePreviewPriorities(challengeId, previewBody)

  const preview = useMemo<PreviewResult>(() => {
    const data = previewQuery.data
    const byTaskId = new Map<number, TaskPriorityValue>()
    const counts: Record<TaskPriorityValue, number> = data
      ? { 0: data.counts.high, 1: data.counts.medium, 2: data.counts.low }
      : { ...EMPTY_COUNTS }
    let changedCount = 0

    if (data) {
      for (const marker of markers) {
        const p = data.priorities[String(marker.id)]
        if (p === undefined) continue
        const priority = p as TaskPriorityValue
        byTaskId.set(marker.id, priority)
        if (priority !== marker.priority) changedCount += 1
      }
    }

    const tierHasAnyConfig: Record<TaskPriorityValue, boolean> = {
      0: !!debouncedDraft.high.rules || !!debouncedDraft.high.bounds,
      1: !!debouncedDraft.medium.rules || !!debouncedDraft.medium.bounds,
      2: !!debouncedDraft.low.rules || !!debouncedDraft.low.bounds,
    }

    const warnings = analyzeWarnings({
      defaultPriority: debouncedDraft.defaultPriority,
      tierCounts: counts,
      tierHasAnyConfig,
      totalTasks: markers.length,
    })

    return {
      byTaskId,
      counts,
      changedCount,
      warnings,
      isEvaluating: previewQuery.isFetching,
    }
  }, [markers, debouncedDraft, previewQuery.data, previewQuery.isFetching])

  // Treat both marker load and the initial preview fetch as loading so the
  // match-count badges don't show stale zeros before the first response.
  const isLoadingCombined = isLoading || (previewQuery.isLoading && !previewQuery.data)

  const value = useMemo<TaskPreviewContextValue>(
    () => ({
      markers,
      isLoading: isLoadingCombined,
      preview,
    }),
    [markers, isLoadingCombined, preview]
  )

  return <TaskPreviewContext.Provider value={value}>{children}</TaskPreviewContext.Provider>
}

export const useTaskPreview = () => {
  const ctx = useContext(TaskPreviewContext)
  if (!ctx) throw new Error('useTaskPreview must be used inside TaskPreviewProvider')
  return ctx
}
