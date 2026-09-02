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
import type { PropertyOperator, PropertyRuleLeaf } from './propertyRuleTypes'
import { useRuleBuilder } from './RuleBuilderContext'

interface Props {
  rule: PropertyRuleLeaf
  onChange: (next: PropertyRuleLeaf) => void
  onRemove?: () => void
}

export const RuleLeaf = ({ rule, onChange, onRemove }: Props) => {
  const { operatorsFor, propertyKeys } = useRuleBuilder()
  const { t } = useIntl()
  const listId = useId()
  const valueType = rule.valueType === 'number' ? 'number' : 'string'
  const ops = operatorsFor(valueType)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 p-2 dark:border-slate-700">
      <Input
        value={rule.key}
        list={propertyKeys.length ? listId : undefined}
        onChange={(e) => onChange({ ...rule, key: e.target.value })}
        placeholder={t(
          'taskPropertyQueryBuilder.ruleLeaf.propertyPlaceholder',
          undefined,
          'property'
        )}
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
      {operatorTakesValue(rule.operator) && (
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <Checkbox
            checked={!!rule.commaSeparate}
            onCheckedChange={(checked) => onChange({ ...rule, commaSeparate: checked === true })}
          />
          {t(
            'taskPropertyQueryBuilder.ruleLeaf.commaSeparate',
            undefined,
            'Comma-separated values'
          )}
        </label>
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
