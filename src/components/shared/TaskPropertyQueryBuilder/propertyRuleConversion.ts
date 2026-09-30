import type {
  BinaryGroup,
  BinaryLeaf,
  BinaryNode,
  PropertyRule,
  PropertyRuleGroup,
  PropertyRuleLeaf,
} from './propertyRuleTypes'

const isBinaryGroup = (node: BinaryNode): node is BinaryGroup =>
  (node as BinaryGroup).valueType === 'compound rule'

export const binaryToFlat = (node: BinaryNode): PropertyRule => {
  if (isBinaryGroup(node)) {
    const children = flattenGroup(node)
    return {
      type: 'group',
      condition: node.condition,
      rules: children,
    }
  }
  const leaf: PropertyRuleLeaf = {
    type: 'leaf',
    key: node.key,
    value: node.value,
    operator: node.operator,
    valueType: node.valueType,
    commaSeparate: node.commaSeparate,
  }
  return leaf
}

const flattenGroup = (node: BinaryGroup): Array<PropertyRuleLeaf | PropertyRuleGroup> => {
  const flatten = (child: BinaryNode): Array<PropertyRuleLeaf | PropertyRuleGroup> => {
    if (isBinaryGroup(child) && child.condition === node.condition) {
      return [...flatten(child.left), ...flatten(child.right)]
    }
    return [binaryToFlat(child) as PropertyRuleLeaf | PropertyRuleGroup]
  }
  return [...flatten(node.left), ...flatten(node.right)]
}

export const flatToBinary = (rule: PropertyRule): BinaryNode => {
  if (rule.type === 'leaf') {
    const { key, value, operator, valueType, commaSeparate } = rule
    return { key, value, operator, valueType, commaSeparate }
  }
  const { rules, condition } = rule
  if (rules.length === 0) {
    throw new Error('Empty rule group')
  }
  if (rules.length === 1) {
    return flatToBinary(rules[0])
  }
  const right = flatToBinary(rules[rules.length - 1])
  const left =
    rules.length === 2
      ? flatToBinary(rules[0])
      : flatToBinary({ type: 'group', condition, rules: rules.slice(0, -1) })
  return { valueType: 'compound rule', condition, left, right }
}

export const validatePropertyRules = (rule: PropertyRule): string[] => {
  const errors: string[] = []
  const walk = (r: PropertyRule) => {
    if (r.type === 'leaf') {
      if (!r.key.trim()) errors.push('Every rule needs a property key')
      const needsValue = r.operator !== 'exists' && r.operator !== 'missing'
      if (needsValue && !r.value.trim()) errors.push('Value required')
    } else {
      if (r.rules.length === 0) errors.push('Group cannot be empty')
      r.rules.forEach(walk)
    }
  }
  walk(rule)
  return errors
}

export const describeRule = (rule: PropertyRule): string => {
  if (rule.type === 'leaf') {
    if (rule.operator === 'exists') return `${rule.key} exists`
    if (rule.operator === 'missing') return `${rule.key} missing`
    return `${rule.key} ${rule.operator} ${rule.value}`
  }
  const inner = rule.rules.map(describeRule).join(rule.condition === 'and' ? ' AND ' : ' OR ')
  return `(${inner})`
}

const emptyLeaf = (): PropertyRuleLeaf => ({
  type: 'leaf',
  key: '',
  value: '',
  operator: 'equals',
})

export type { BinaryLeaf }
export { emptyLeaf as createEmptyLeaf }
