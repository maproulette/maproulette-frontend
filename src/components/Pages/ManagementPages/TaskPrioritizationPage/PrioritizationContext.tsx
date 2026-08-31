import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import type { BinaryNode } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import { TaskPriority, type TaskPriorityValue } from '@/types/Priority'
import { draftsEqual } from './prioritizationParsing'

export type Tier = 'high' | 'medium' | 'low'

export const TIER_TO_PRIORITY: Record<Tier, TaskPriorityValue> = {
  high: TaskPriority.HIGH,
  medium: TaskPriority.MEDIUM,
  low: TaskPriority.LOW,
}

export interface TierDraft {
  rules: BinaryNode | null
  bounds: GeoJSON.FeatureCollection | null
}

export interface PrioritizationDraft {
  defaultPriority: TaskPriorityValue
  high: TierDraft
  medium: TierDraft
  low: TierDraft
}

interface PrioritizationContextValue {
  draft: PrioritizationDraft
  initial: PrioritizationDraft
  setDefaultPriority: (priority: TaskPriorityValue) => void
  setTierRules: (tier: Tier, rules: BinaryNode | null) => void
  setTierBounds: (tier: Tier, bounds: GeoJSON.FeatureCollection | null) => void
  reset: () => void
  markSaved: () => void
  isDirty: boolean
}

const PrioritizationContext = createContext<PrioritizationContextValue | null>(null)

export const PrioritizationProvider = ({
  children,
  initialDraft,
}: {
  children: ReactNode
  initialDraft: PrioritizationDraft
}) => {
  const [initial, setInitial] = useState<PrioritizationDraft>(initialDraft)
  const [draft, setDraft] = useState<PrioritizationDraft>(initialDraft)

  const setDefaultPriority = useCallback(
    (priority: TaskPriorityValue) => setDraft((prev) => ({ ...prev, defaultPriority: priority })),
    []
  )

  const setTierRules = useCallback(
    (tier: Tier, rules: BinaryNode | null) =>
      setDraft((prev) => ({ ...prev, [tier]: { ...prev[tier], rules } })),
    []
  )

  const setTierBounds = useCallback(
    (tier: Tier, bounds: GeoJSON.FeatureCollection | null) =>
      setDraft((prev) => ({ ...prev, [tier]: { ...prev[tier], bounds } })),
    []
  )

  const reset = useCallback(() => setDraft(initial), [initial])
  const markSaved = useCallback(() => setInitial(draft), [draft])

  const isDirty = useMemo(() => !draftsEqual(draft, initial), [draft, initial])

  const value = useMemo<PrioritizationContextValue>(
    () => ({
      draft,
      initial,
      setDefaultPriority,
      setTierRules,
      setTierBounds,
      reset,
      markSaved,
      isDirty,
    }),
    [draft, initial, setDefaultPriority, setTierRules, setTierBounds, reset, markSaved, isDirty]
  )

  return <PrioritizationContext.Provider value={value}>{children}</PrioritizationContext.Provider>
}

export const usePrioritizationContext = () => {
  const ctx = useContext(PrioritizationContext)
  if (!ctx) {
    throw new Error('usePrioritizationContext must be used inside PrioritizationProvider')
  }
  return ctx
}
