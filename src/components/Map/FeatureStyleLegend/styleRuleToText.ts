export interface TaskPropertySearch {
  key?: string
  value?: string | number
  searchType?: string
  operationType?: string
  left?: TaskPropertySearch
  right?: TaskPropertySearch
  condition?: 'and' | 'or'
}

export interface TaskStyleRule {
  propertySearch: TaskPropertySearch
  styles: { styleName: string; styleValue: string }[]
}

const operatorSymbol: Record<string, string> = {
  equals: '=',
  notEqual: '!=',
  contains: 'contains',
  exists: 'exists',
  missing: 'missing',
  greaterThan: '>',
  lessThan: '<',
  greaterThanOrEqual: '>=',
  lessThanOrEqual: '<=',
}

export const styleRuleToText = (node: TaskPropertySearch | undefined): string => {
  if (!node) return ''
  if (node.left && node.right) {
    const left = styleRuleToText(node.left)
    const right = styleRuleToText(node.right)
    const joiner = node.condition === 'or' ? ' OR ' : ' AND '
    return `(${left}${joiner}${right})`
  }
  const op = node.operationType ? (operatorSymbol[node.operationType] ?? node.operationType) : '='
  if (node.operationType === 'exists' || node.operationType === 'missing') {
    return `${node.key} ${op}`
  }
  return `${node.key ?? '?'} ${op} ${node.value ?? ''}`
}
