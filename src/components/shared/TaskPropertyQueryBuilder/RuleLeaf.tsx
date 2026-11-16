import { X } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import { operatorLabels, operatorTakesValue } from './operators'
import {
  isNumericValueType,
  type PropertyOperator,
  type PropertyRuleLeaf,
  type RuleValueType,
} from './propertyRuleTypes'
import { useRuleBuilder } from './RuleBuilderContext'

const valueTypeLabels = (t: ReturnType<typeof useIntl>['t']): Record<RuleValueType, string> => ({
  string: t({ id: 'taskPropertyQueryBuilder.ruleLeaf.typeString', defaultMessage: 'string' }),
  number: t({ id: 'taskPropertyQueryBuilder.ruleLeaf.typeNumber', defaultMessage: 'number' }),
  integer: t({ id: 'taskPropertyQueryBuilder.ruleLeaf.typeInteger', defaultMessage: 'integer' }),
  double: t({ id: 'taskPropertyQueryBuilder.ruleLeaf.typeDouble', defaultMessage: 'double' }),
  long: t({ id: 'taskPropertyQueryBuilder.ruleLeaf.typeLong', defaultMessage: 'long' }),
})

interface Props {
  rule: PropertyRuleLeaf
  onChange: (next: PropertyRuleLeaf) => void
  onRemove?: () => void
}

export const RuleLeaf = ({ rule, onChange, onRemove }: Props) => {
  const { operatorsFor, propertyKeys, valueTypes } = useRuleBuilder()
  const { t } = useIntl()
  const listId = useId()
  const commaSeparateId = useId()
  const valueType = isNumericValueType(rule.valueType) ? 'number' : 'string'
  const ops = operatorsFor(valueType)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 p-2 dark:border-slate-700">
      <Input
        value={rule.key}
        list={propertyKeys.length ? listId : undefined}
        onChange={(e) => onChange({ ...rule, key: e.target.value })}
        placeholder={t({
          id: 'taskPropertyQueryBuilder.ruleLeaf.propertyPlaceholder',
          defaultMessage: 'property',
        })}
        className="max-w-40"
      />
      {propertyKeys.length > 0 && (
        <datalist id={listId}>
          {propertyKeys.map((key) => (
            <option key={key} value={key} />
          ))}
        </datalist>
      )}
      <Select
        value={rule.valueType ?? 'string'}
        onValueChange={(v) => onChange({ ...rule, valueType: v as RuleValueType })}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {valueTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {valueTypeLabels(t)[type]}
            </SelectItem>
          ))}
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
          placeholder={t({
            id: 'taskPropertyQueryBuilder.ruleLeaf.valuePlaceholder',
            defaultMessage: 'value',
          })}
          className="max-w-40"
        />
      )}
      {operatorTakesValue(rule.operator) && (
        <label
          htmlFor={commaSeparateId}
          className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
        >
          <Checkbox
            id={commaSeparateId}
            checked={!!rule.commaSeparate}
            onCheckedChange={(checked) => onChange({ ...rule, commaSeparate: checked === true })}
          />
          {t({
            id: 'taskPropertyQueryBuilder.ruleLeaf.commaSeparate',
            defaultMessage: 'Comma-separated values',
          })}
        </label>
      )}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t({
            id: 'taskPropertyQueryBuilder.ruleLeaf.removeRule',
            defaultMessage: 'Remove rule',
          })}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
