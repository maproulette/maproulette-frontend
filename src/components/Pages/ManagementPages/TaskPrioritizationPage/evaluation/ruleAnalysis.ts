import { defineMessages, type MessageDescriptor } from 'react-intl'
import type { TaskPriorityValue } from '@/types/Priority'

/**
 * Surface-level warnings computed once per evaluation pass. The UI renders
 * these inline on each tier header and on the summary card.
 */
export interface PrioritizationWarnings {
  tier: Record<TaskPriorityValue, TierWarning[]>
  global: GlobalWarning[]
}

type TierWarning = { kind: 'dead-rule' | 'all-match'; message: MessageDescriptor }

type GlobalWarning = { kind: 'swallowed-default' | 'no-rules'; message: MessageDescriptor }

const WARNING_MESSAGES = defineMessages({
  'dead-rule': {
    id: 'taskPrioritizationPage.warnings.deadRule',
    defaultMessage: 'No tasks match these rules — the tier is unreachable.',
  },
  'all-match': {
    id: 'taskPrioritizationPage.warnings.allMatch',
    defaultMessage: 'Every task matches — lower tiers become unreachable.',
  },
  'no-rules': {
    id: 'taskPrioritizationPage.warnings.noRules',
    defaultMessage: 'No rules configured — every task will use the default priority.',
  },
  'swallowed-default': {
    id: 'taskPrioritizationPage.warnings.swallowedDefault',
    defaultMessage: 'Default is High with no High rules — medium/low rules may never apply.',
  },
})

export interface AnalyzeInput {
  defaultPriority: TaskPriorityValue
  tierCounts: Record<TaskPriorityValue, number>
  tierHasAnyConfig: Record<TaskPriorityValue, boolean>
  totalTasks: number
}

const EMPTY_TIER: TierWarning[] = []

export const analyzeWarnings = (input: AnalyzeInput): PrioritizationWarnings => {
  const tier: Record<TaskPriorityValue, TierWarning[]> = {
    0: [...EMPTY_TIER],
    1: [...EMPTY_TIER],
    2: [...EMPTY_TIER],
  }
  const global: GlobalWarning[] = []

  ;([0, 1, 2] as TaskPriorityValue[]).forEach((p) => {
    const configured = input.tierHasAnyConfig[p]
    const count = input.tierCounts[p] ?? 0
    if (configured && count === 0) {
      tier[p].push({ kind: 'dead-rule', message: WARNING_MESSAGES['dead-rule'] })
    }
    if (configured && input.totalTasks > 0 && count === input.totalTasks) {
      tier[p].push({ kind: 'all-match', message: WARNING_MESSAGES['all-match'] })
    }
  })

  const anyRules = ([0, 1, 2] as TaskPriorityValue[]).some((p) => input.tierHasAnyConfig[p])
  if (!anyRules) {
    global.push({ kind: 'no-rules', message: WARNING_MESSAGES['no-rules'] })
  }
  if (anyRules && !input.tierHasAnyConfig[0] && input.defaultPriority === 0) {
    global.push({ kind: 'swallowed-default', message: WARNING_MESSAGES['swallowed-default'] })
  }

  return { tier, global }
}
