export type PropertyOperator =
  | 'equals'
  | 'notEqual'
  | 'contains'
  | 'exists'
  | 'missing'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'

export type NumericValueType = 'number' | 'integer' | 'double' | 'long'

export type RuleValueType = 'string' | NumericValueType

export const isNumericValueType = (
  valueType: RuleValueType | undefined
): valueType is NumericValueType => valueType !== undefined && valueType !== 'string'

export interface PropertyRuleLeaf {
  type: 'leaf'
  key: string
  value: string
  operator: PropertyOperator
  valueType?: RuleValueType
  commaSeparate?: boolean
}

export interface PropertyRuleGroup {
  type: 'group'
  condition: 'and' | 'or'
  rules: Array<PropertyRuleLeaf | PropertyRuleGroup>
}

export type PropertyRule = PropertyRuleLeaf | PropertyRuleGroup

export interface BinaryLeaf {
  key: string
  value: string
  operator: PropertyOperator
  valueType?: RuleValueType
  commaSeparate?: boolean
}

export interface BinaryGroup {
  valueType: 'compound rule'
  condition: 'and' | 'or'
  left: BinaryNode
  right: BinaryNode
}

export type BinaryNode = BinaryLeaf | BinaryGroup
