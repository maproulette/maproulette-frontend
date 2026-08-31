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

export interface PropertyRuleLeaf {
  type: 'leaf'
  key: string
  value: string
  operator: PropertyOperator
  valueType?: 'string' | 'number'
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
  valueType?: 'string' | 'number'
  commaSeparate?: boolean
}

export interface BinaryGroup {
  valueType: 'compound rule'
  condition: 'and' | 'or'
  left: BinaryNode
  right: BinaryNode
}

export type BinaryNode = BinaryLeaf | BinaryGroup
