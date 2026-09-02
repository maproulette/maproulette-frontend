import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup'
import { useIntl } from '@/i18n'
import { createEmptyLeaf } from './propertyRuleConversion'
import type { PropertyRule, PropertyRuleGroup } from './propertyRuleTypes'
import { RuleLeaf } from './RuleLeaf'

interface Props {
  group: PropertyRuleGroup
  onChange: (next: PropertyRuleGroup) => void
  onRemove?: () => void
  depth?: number
}

export const RuleGroup = ({ group, onChange, onRemove, depth = 0 }: Props) => {
  const { t } = useIntl()

  const updateRule = (index: number, updated: PropertyRule) => {
    const rules = [...group.rules]
    rules[index] = updated as (typeof rules)[number]
    onChange({ ...group, rules })
  }

  const removeRule = (index: number) => {
    onChange({ ...group, rules: group.rules.filter((_, i) => i !== index) })
  }

  const addRule = () => {
    onChange({ ...group, rules: [...group.rules, createEmptyLeaf()] })
  }

  const addGroup = () => {
    onChange({
      ...group,
      rules: [...group.rules, { type: 'group', condition: 'and', rules: [createEmptyLeaf()] }],
    })
  }

  return (
    <div
      className={`space-y-2 rounded-md border border-zinc-200 p-3 dark:border-slate-700 ${
        depth > 0 ? 'bg-zinc-50 dark:bg-slate-800/40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup
          type="single"
          value={group.condition}
          onValueChange={(v) => v && onChange({ ...group, condition: v as 'and' | 'or' })}
        >
          <ToggleGroupItem value="and">
            {t('taskPropertyQueryBuilder.ruleGroup.and', undefined, 'AND')}
          </ToggleGroupItem>
          <ToggleGroupItem value="or">
            {t('taskPropertyQueryBuilder.ruleGroup.or', undefined, 'OR')}
          </ToggleGroupItem>
        </ToggleGroup>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t(
              'taskPropertyQueryBuilder.ruleGroup.removeGroup',
              undefined,
              'Remove group'
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {group.rules.map((rule, i) => {
          const key = `${rule.type}-${i}`
          return rule.type === 'leaf' ? (
            <RuleLeaf
              key={key}
              rule={rule}
              onChange={(next) => updateRule(i, next)}
              onRemove={group.rules.length > 1 ? () => removeRule(i) : undefined}
            />
          ) : (
            <RuleGroup
              key={key}
              group={rule}
              onChange={(next) => updateRule(i, next)}
              onRemove={() => removeRule(i)}
              depth={depth + 1}
            />
          )
        })}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRule}>
          <Plus className="size-3" aria-hidden="true" />{' '}
          {t('taskPropertyQueryBuilder.ruleGroup.addRule', undefined, 'Rule')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="size-3" aria-hidden="true" />{' '}
          {t('taskPropertyQueryBuilder.ruleGroup.addGroup', undefined, 'Group')}
        </Button>
      </div>
    </div>
  )
}
