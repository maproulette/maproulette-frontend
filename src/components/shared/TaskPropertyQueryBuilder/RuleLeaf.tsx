import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import { numberOperators, operatorLabels, operatorTakesValue, stringOperators } from './operators'
import type { PropertyOperator, PropertyRuleLeaf } from './propertyRuleTypes'

interface Props {
  rule: PropertyRuleLeaf
  onChange: (next: PropertyRuleLeaf) => void
  onRemove?: () => void
  /**
   * Narrows the operators on offer for the given value type. Task-property
   * search understands fewer of them than priority rules do, so the caller
   * decides rather than the builder offering operators that can't be honored.
   */
  operatorsFor?: (valueType: 'string' | 'number') => PropertyOperator[]
}

export const RuleLeaf = ({ rule, onChange, onRemove, operatorsFor }: Props) => {
  const { t } = useIntl()
  const valueType = rule.valueType === 'number' ? 'number' : 'string'
  const ops = operatorsFor
    ? operatorsFor(valueType)
    : valueType === 'number'
      ? numberOperators
      : stringOperators

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 p-2 dark:border-slate-700">
      <Input
        value={rule.key}
        onChange={(e) => onChange({ ...rule, key: e.target.value })}
        placeholder={t(
          'taskPropertyQueryBuilder.ruleLeaf.propertyPlaceholder',
          undefined,
          'property'
        )}
        className="max-w-40"
      />
      <Select
        value={rule.valueType ?? 'string'}
        onValueChange={(v) => onChange({ ...rule, valueType: v as 'string' | 'number' })}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="string">
            {t('taskPropertyQueryBuilder.ruleLeaf.typeString', undefined, 'string')}
          </SelectItem>
          <SelectItem value="number">
            {t('taskPropertyQueryBuilder.ruleLeaf.typeNumber', undefined, 'number')}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={rule.operator}
        onValueChange={(v) => onChange({ ...rule, operator: v as PropertyOperator })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ops.map((op) => (
            <SelectItem key={op} value={op}>
              {operatorLabels[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {operatorTakesValue(rule.operator) && (
        <Input
          value={rule.value}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          placeholder={t('taskPropertyQueryBuilder.ruleLeaf.valuePlaceholder', undefined, 'value')}
          className="max-w-40"
        />
      )}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t('taskPropertyQueryBuilder.ruleLeaf.removeRule', undefined, 'Remove rule')}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
