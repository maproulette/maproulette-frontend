import { TaskPropertyQueryBuilder } from '@/components/shared/TaskPropertyQueryBuilder'
import { PRIORITY_RULE_VALUE_TYPES } from '@/components/shared/TaskPropertyQueryBuilder/backendRuleShape'
import type { TaskPriorityValue } from '@/types/Priority'
import { TIER_TO_PRIORITY, type Tier, usePrioritizationContext } from '../PrioritizationContext'
import { TierMatchCount } from './TierMatchCount'
import { TierWarningBadges } from './TierWarningBadges'

interface Props {
  tier: Tier
}

export const PriorityTierPanel = ({ tier }: Props) => {
  const { draft, setTierRules } = usePrioritizationContext()
  const priority: TaskPriorityValue = TIER_TO_PRIORITY[tier]
  const tierDraft = draft[tier]

  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <TierMatchCount priority={priority} />
        <TierWarningBadges priority={priority} />
      </div>
      <TaskPropertyQueryBuilder
        value={tierDraft.rules}
        onChange={(next) => setTierRules(tier, next)}
        valueTypes={PRIORITY_RULE_VALUE_TYPES}
      />
    </div>
  )
}
