import type { PropertyOperator } from './propertyRuleTypes'

export const stringOperators: PropertyOperator[] = [
  'equals',
  'notEqual',
  'contains',
  'exists',
  'missing',
]

export const numberOperators: PropertyOperator[] = [
  'equals',
  'notEqual',
  'greaterThan',
  'lessThan',
  'greaterThanOrEqual',
  'lessThanOrEqual',
]

export const operatorLabels: Record<PropertyOperator, string> = {
  equals: 'equals',
  notEqual: 'does not equal',
  contains: 'contains',
  exists: 'exists',
  missing: 'is missing',
  greaterThan: 'greater than',
  lessThan: 'less than',
  greaterThanOrEqual: 'greater than or equal to',
  lessThanOrEqual: 'less than or equal to',
}

export const operatorTakesValue = (op: PropertyOperator): boolean =>
  op !== 'exists' && op !== 'missing'
