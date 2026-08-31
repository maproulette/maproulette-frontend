import { useMemo, useState } from 'react'
import { logger } from '@/lib/logger'
import {
  binaryToFlat,
  createEmptyLeaf,
  describeRule,
  flatToBinary,
  validatePropertyRules,
} from './propertyRuleConversion'
import type { BinaryNode, PropertyRuleGroup } from './propertyRuleTypes'
import { RuleGroup } from './RuleGroup'

interface Props {
  value?: BinaryNode | null
  onChange?: (next: BinaryNode | null) => void
}

const emptyGroup = (): PropertyRuleGroup => ({
  type: 'group',
  condition: 'and',
  rules: [createEmptyLeaf()],
})

export const TaskPropertyQueryBuilder = ({ value, onChange }: Props) => {
  const [flat, setFlat] = useState<PropertyRuleGroup>(() => {
    if (!value) return emptyGroup()
    const parsed = binaryToFlat(value)
    return parsed.type === 'group' ? parsed : { type: 'group', condition: 'and', rules: [parsed] }
  })

  const errors = useMemo(() => validatePropertyRules(flat), [flat])
  const summary = useMemo(() => describeRule(flat), [flat])

  const handleChange = (next: PropertyRuleGroup) => {
    setFlat(next)
    if (validatePropertyRules(next).length === 0 && next.rules.length > 0) {
      try {
        onChange?.(flatToBinary(next))
      } catch (error) {
        logger.warn('Rule to binary conversion failed', { error })
        onChange?.(null)
      }
    } else {
      onChange?.(null)
    }
  }

  return (
    <div className="space-y-3">
      <RuleGroup group={flat} onChange={handleChange} />
      {errors.length > 0 && (
        <ul className="text-red-600 text-sm dark:text-red-400">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="rounded-md bg-zinc-50 p-2 font-mono text-xs text-zinc-600 dark:bg-slate-800 dark:text-slate-400">
        {summary}
      </div>
    </div>
  )
}

export type { PropertyRuleGroup } from './propertyRuleTypes'
